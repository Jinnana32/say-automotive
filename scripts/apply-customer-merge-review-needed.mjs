#!/usr/bin/env node

/**
 * Apply approved "review-needed" customer merges for Mandurriao.
 *
 * Preserves operational history by only rehoming customer_id FKs.
 * Never rewrites document dates, statuses, items, or service history payloads.
 *
 * For distinct phones on MERGE customers:
 *   - keep KEEP.contact_number as primary
 *   - store first distinct merge phone in KEEP.contact_number_secondary
 *   - append any extra distinct phones / alternate addresses into KEEP notes
 *
 * Usage:
 *   node --env-file=.env.local scripts/apply-customer-merge-review-needed.mjs \
 *     --review=scripts/customer-merge-review-d521b15c.json
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {
    review: "scripts/customer-merge-review-d521b15c.json",
    dryRun: false,
    confidence: "review-needed",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--review=")) args.review = arg.slice("--review=".length);
    else if (arg.startsWith("--confidence=")) args.confidence = arg.slice("--confidence=".length);
  }

  return args;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizePhone(value) {
  return (value ?? "").replace(/\D+/g, "");
}

function normalizeAddress(value) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

async function updateByIds(supabase, table, ids, payload, dryRun) {
  if (ids.length === 0) {
    return { count: 0 };
  }
  if (dryRun) {
    return { count: ids.length };
  }

  // Only customer_id is updated — created_at / service_date / item rows stay untouched.
  const { error, count } = await supabase
    .from(table)
    .update(payload, { count: "exact" })
    .in("id", ids);

  if (error) {
    throw new Error(`${table} update failed: ${error.message}`);
  }

  return { count: count ?? ids.length };
}

async function fetchIds(supabase, table, column, values) {
  if (values.length === 0) return [];
  const { data, error } = await supabase.from(table).select("id").in(column, values);
  if (error) throw new Error(`${table} fetch failed: ${error.message}`);
  return data ?? [];
}

function buildKeepEnrichment(keepCustomer, mergeCustomers) {
  const patch = {};
  const noteParts = [];

  const keepPhoneNorm = normalizePhone(keepCustomer.contact_number);
  const keepSecondaryNorm = normalizePhone(keepCustomer.contact_number_secondary);
  const keepAddressNorm = normalizeAddress(keepCustomer.address);

  const distinctMergePhones = [];
  for (const mergeCustomer of mergeCustomers) {
    const phone = mergeCustomer.contact_number?.trim();
    if (!phone) continue;
    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) continue;
    if (phoneNorm === keepPhoneNorm || phoneNorm === keepSecondaryNorm) continue;
    if (distinctMergePhones.some((entry) => normalizePhone(entry) === phoneNorm)) continue;
    distinctMergePhones.push(phone);
  }

  if (!keepCustomer.contact_number && distinctMergePhones.length > 0) {
    patch.contact_number = distinctMergePhones.shift();
  }

  if (!keepCustomer.contact_number_secondary && distinctMergePhones.length > 0) {
    patch.contact_number_secondary = distinctMergePhones.shift();
  }

  for (const extraPhone of distinctMergePhones) {
    noteParts.push(`Alternate contact number preserved from merge: ${extraPhone}`);
  }

  if (!keepCustomer.address) {
    const firstAddress = mergeCustomers.find((row) => row.address?.trim())?.address?.trim();
    if (firstAddress) {
      patch.address = firstAddress;
    }
  }

  const alternateAddresses = [];
  for (const mergeCustomer of mergeCustomers) {
    const address = mergeCustomer.address?.trim();
    if (!address) continue;
    const addressNorm = normalizeAddress(address);
    if (!addressNorm) continue;
    if (addressNorm === keepAddressNorm) continue;
    if (normalizeAddress(patch.address) === addressNorm) continue;
    if (alternateAddresses.some((entry) => normalizeAddress(entry) === addressNorm)) continue;
    alternateAddresses.push(address);
  }

  for (const address of alternateAddresses) {
    noteParts.push(`Alternate address preserved from merge: ${address}`);
  }

  if (noteParts.length > 0) {
    const existingNotes = keepCustomer.notes?.trim() || "";
    const addition = noteParts.join("\n");
    patch.notes = existingNotes ? `${existingNotes}\n${addition}` : addition;
  }

  return patch;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reviewPath = resolve(process.cwd(), args.review);

  if (!existsSync(reviewPath)) {
    throw new Error(`Review file not found: ${reviewPath}`);
  }

  const review = JSON.parse(readFileSync(reviewPath, "utf8"));
  const groups = (review.groups ?? []).filter((group) => group.confidence === args.confidence);

  if (groups.length === 0) {
    throw new Error(`No groups found with confidence=${args.confidence}.`);
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  // Fail fast if secondary-phone migration is not applied yet.
  {
    const { error } = await supabase
      .from("customers")
      .select("id, contact_number_secondary")
      .limit(1);
    if (error) {
      throw new Error(
        `customers.contact_number_secondary unavailable (${error.message}). Apply migration 0052 first.`,
      );
    }
  }

  const report = {
    startedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    confidence: args.confidence,
    branchId: review.summary?.branchId ?? null,
    groupsRequested: groups.length,
    groupsProcessed: 0,
    groupsFailed: 0,
    totals: {
      vehiclesMoved: 0,
      quotationsMoved: 0,
      jobOrdersMoved: 0,
      invoicesMoved: 0,
      salesMoved: 0,
      customersDeactivated: 0,
      keepEnriched: 0,
      secondaryPhonesSet: 0,
    },
    results: [],
  };

  for (const group of groups) {
    const keepId = group.keepCustomerId;
    const mergeIds = [...(group.mergeCustomerIds ?? [])];
    const result = {
      groupNo: group.groupNo,
      displayName: group.displayName,
      keepCustomerId: keepId,
      mergeCustomerIds: mergeIds,
      ok: false,
      error: null,
      vehiclesMoved: 0,
      quotationsMoved: 0,
      jobOrdersMoved: 0,
      invoicesMoved: 0,
      salesMoved: 0,
      customersDeactivated: 0,
      keepEnriched: false,
      secondaryPhoneSet: false,
      enrichmentPatch: null,
    };

    try {
      if (!keepId || mergeIds.length === 0) {
        throw new Error("Invalid keep/merge ids.");
      }

      const { data: keepCustomer, error: keepError } = await supabase
        .from("customers")
        .select(
          "id, display_name, contact_number, contact_number_secondary, address, status, branch_id, notes",
        )
        .eq("id", keepId)
        .maybeSingle();

      if (keepError) throw new Error(keepError.message);
      if (!keepCustomer) throw new Error(`KEEP customer not found: ${keepId}`);

      const { data: mergeCustomers, error: mergeError } = await supabase
        .from("customers")
        .select("id, display_name, contact_number, contact_number_secondary, address, status, notes")
        .in("id", mergeIds);

      if (mergeError) throw new Error(mergeError.message);

      const foundMergeIds = new Set((mergeCustomers ?? []).map((row) => row.id));
      const missing = mergeIds.filter((id) => !foundMergeIds.has(id));
      if (missing.length > 0) {
        throw new Error(`MERGE customers missing: ${missing.join(", ")}`);
      }

      // Rehome ownership only. Document dates / items / repair history stay as-is.
      const vehicles = await fetchIds(supabase, "vehicles", "customer_id", mergeIds);
      result.vehiclesMoved = (
        await updateByIds(supabase, "vehicles", vehicles.map((row) => row.id), { customer_id: keepId }, args.dryRun)
      ).count;

      const quotations = await fetchIds(supabase, "quotations", "customer_id", mergeIds);
      result.quotationsMoved = (
        await updateByIds(
          supabase,
          "quotations",
          quotations.map((row) => row.id),
          { customer_id: keepId },
          args.dryRun,
        )
      ).count;

      const jobOrders = await fetchIds(supabase, "job_orders", "customer_id", mergeIds);
      result.jobOrdersMoved = (
        await updateByIds(
          supabase,
          "job_orders",
          jobOrders.map((row) => row.id),
          { customer_id: keepId },
          args.dryRun,
        )
      ).count;

      const invoices = await fetchIds(supabase, "invoices", "customer_id", mergeIds);
      result.invoicesMoved = (
        await updateByIds(
          supabase,
          "invoices",
          invoices.map((row) => row.id),
          { customer_id: keepId },
          args.dryRun,
        )
      ).count;

      const sales = await fetchIds(supabase, "sales", "customer_id", mergeIds);
      result.salesMoved = (
        await updateByIds(
          supabase,
          "sales",
          sales.map((row) => row.id),
          { customer_id: keepId },
          args.dryRun,
        )
      ).count;

      const deactivateNote = `Merged into customer ${keepId} on ${new Date().toISOString()} (review-needed approval). Legacy document dates and repair history were preserved.`;
      if (!args.dryRun) {
        for (const mergeCustomer of mergeCustomers ?? []) {
          const existingNotes = mergeCustomer.notes?.trim() || "";
          const notes = existingNotes ? `${existingNotes}\n${deactivateNote}` : deactivateNote;
          const { error } = await supabase
            .from("customers")
            .update({ status: "inactive", notes })
            .eq("id", mergeCustomer.id);
          if (error) {
            throw new Error(`Failed deactivating ${mergeCustomer.id}: ${error.message}`);
          }
        }
      }
      result.customersDeactivated = mergeIds.length;

      const enrichmentPatch = buildKeepEnrichment(keepCustomer, mergeCustomers ?? []);
      result.enrichmentPatch = enrichmentPatch;
      if (Object.keys(enrichmentPatch).length > 0) {
        result.keepEnriched = true;
        if (enrichmentPatch.contact_number_secondary) {
          result.secondaryPhoneSet = true;
        }
        if (!args.dryRun) {
          const { error } = await supabase.from("customers").update(enrichmentPatch).eq("id", keepId);
          if (error) {
            throw new Error(`Failed enriching KEEP ${keepId}: ${error.message}`);
          }
        }
      }

      if (!args.dryRun) {
        const leftoverVehicles = await fetchIds(supabase, "vehicles", "customer_id", mergeIds);
        if (leftoverVehicles.length > 0) {
          throw new Error(
            `Leftover vehicles on merge customers: ${leftoverVehicles.map((row) => row.id).join(", ")}`,
          );
        }
      }

      result.ok = true;
      report.groupsProcessed += 1;
      report.totals.vehiclesMoved += result.vehiclesMoved;
      report.totals.quotationsMoved += result.quotationsMoved;
      report.totals.jobOrdersMoved += result.jobOrdersMoved;
      report.totals.invoicesMoved += result.invoicesMoved;
      report.totals.salesMoved += result.salesMoved;
      report.totals.customersDeactivated += result.customersDeactivated;
      if (result.keepEnriched) report.totals.keepEnriched += 1;
      if (result.secondaryPhoneSet) report.totals.secondaryPhonesSet += 1;
    } catch (error) {
      result.ok = false;
      result.error = error instanceof Error ? error.message : String(error);
      report.groupsFailed += 1;
    }

    report.results.push(result);
    const tag = result.ok ? "OK" : "FAIL";
    console.log(
      `[${tag}] #${group.groupNo} ${group.displayName} · V ${result.vehiclesMoved} · Q ${result.quotationsMoved} · JO ${result.jobOrdersMoved}${
        result.secondaryPhoneSet ? " · +secondary phone" : ""
      }${result.error ? ` · ${result.error}` : ""}`,
    );
  }

  report.finishedAt = new Date().toISOString();

  const outJson = resolve(
    process.cwd(),
    "scripts/customer-merge-apply-review-needed-d521b15c-report.json",
  );
  const outMd = resolve(
    process.cwd(),
    "scripts/customer-merge-apply-review-needed-d521b15c-report.md",
  );
  writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const failed = report.results.filter((row) => !row.ok);
  const lines = [
    "# Customer merge apply report — review-needed",
    "",
    `- Branch: \`${report.branchId}\``,
    `- Dry run: ${report.dryRun}`,
    `- Groups requested: ${report.groupsRequested}`,
    `- Groups processed: ${report.groupsProcessed}`,
    `- Groups failed: ${report.groupsFailed}`,
    "",
    "## Totals",
    "",
    `- Vehicles moved: ${report.totals.vehiclesMoved}`,
    `- Quotations moved: ${report.totals.quotationsMoved}`,
    `- Job orders moved: ${report.totals.jobOrdersMoved}`,
    `- Invoices moved: ${report.totals.invoicesMoved}`,
    `- Sales moved: ${report.totals.salesMoved}`,
    `- Customers deactivated: ${report.totals.customersDeactivated}`,
    `- KEEP profiles enriched: ${report.totals.keepEnriched}`,
    `- Secondary phones set: ${report.totals.secondaryPhonesSet}`,
    "",
    "Document dates, job-order item history, and service dates are preserved (only `customer_id` ownership is updated).",
    "",
  ];

  if (failed.length > 0) {
    lines.push("## Failures", "");
    for (const row of failed) {
      lines.push(`- #${row.groupNo} ${row.displayName}: ${row.error}`);
    }
    lines.push("");
  }

  lines.push("## Per group", "");
  for (const row of report.results) {
    lines.push(
      `- ${row.ok ? "OK" : "FAIL"} #${row.groupNo} ${row.displayName} → KEEP \`${row.keepCustomerId}\` · V ${row.vehiclesMoved} · Q ${row.quotationsMoved} · JO ${row.jobOrdersMoved}${
        row.secondaryPhoneSet ? " · secondary phone preserved" : ""
      } · deactivated ${row.customersDeactivated}`,
    );
  }
  lines.push("");

  writeFileSync(outMd, `${lines.join("\n")}\n`, "utf8");
  writeFileSync("/tmp/customer-merge-apply-review-needed-d521b15c-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync("/tmp/customer-merge-apply-review-needed-d521b15c-report.md", `${lines.join("\n")}\n`, "utf8");

  console.log(`Wrote ${outJson}`);
  console.log(`Wrote ${outMd}`);

  if (report.groupsFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
