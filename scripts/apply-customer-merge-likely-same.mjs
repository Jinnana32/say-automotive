#!/usr/bin/env node

/**
 * Apply approved "likely-same" customer merges for a branch.
 *
 * Usage:
 *   node --env-file=.env.local scripts/apply-customer-merge-likely-same.mjs \
 *     --review=scripts/customer-merge-review-d521b15c.json
 *
 * Order (to satisfy vehicle/quotation/JO consistency triggers):
 *   1) Rehome vehicles → KEEP
 *   2) Rehome quotations → KEEP
 *   3) Rehome job orders → KEEP
 *   4) Rehome invoices / sales → KEEP
 *   5) Soft-deactivate MERGE customers
 *   6) Fill blank phone/address on KEEP from merge customers when useful
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {
    review: "scripts/customer-merge-review-d521b15c.json",
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--review=")) args.review = arg.slice("--review=".length);
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

async function updateByIds(supabase, table, ids, payload, dryRun) {
  if (ids.length === 0) {
    return { count: 0 };
  }
  if (dryRun) {
    return { count: ids.length };
  }

  const { error, count } = await supabase
    .from(table)
    .update(payload, { count: "exact" })
    .in("id", ids);

  if (error) {
    throw new Error(`${table} update failed: ${error.message}`);
  }

  return { count: count ?? ids.length };
}

async function fetchIds(supabase, table, column, values, select = "id") {
  if (values.length === 0) return [];
  const { data, error } = await supabase.from(table).select(select).in(column, values);
  if (error) throw new Error(`${table} fetch failed: ${error.message}`);
  return data ?? [];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reviewPath = resolve(process.cwd(), args.review);

  if (!existsSync(reviewPath)) {
    throw new Error(`Review file not found: ${reviewPath}`);
  }

  const review = JSON.parse(readFileSync(reviewPath, "utf8"));
  const groups = (review.groups ?? []).filter((group) => group.confidence === "likely-same");

  if (groups.length === 0) {
    throw new Error("No likely-same groups found in review file.");
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const report = {
    startedAt: new Date().toISOString(),
    dryRun: args.dryRun,
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
    };

    try {
      if (!keepId || mergeIds.length === 0) {
        throw new Error("Invalid keep/merge ids.");
      }

      const { data: keepCustomer, error: keepError } = await supabase
        .from("customers")
        .select("id, display_name, contact_number, address, status, branch_id, notes")
        .eq("id", keepId)
        .maybeSingle();

      if (keepError) throw new Error(keepError.message);
      if (!keepCustomer) throw new Error(`KEEP customer not found: ${keepId}`);

      const { data: mergeCustomers, error: mergeError } = await supabase
        .from("customers")
        .select("id, display_name, contact_number, address, status, notes")
        .in("id", mergeIds);

      if (mergeError) throw new Error(mergeError.message);

      const foundMergeIds = new Set((mergeCustomers ?? []).map((row) => row.id));
      const missing = mergeIds.filter((id) => !foundMergeIds.has(id));
      if (missing.length > 0) {
        throw new Error(`MERGE customers missing: ${missing.join(", ")}`);
      }

      // 1) vehicles
      const vehicles = await fetchIds(supabase, "vehicles", "customer_id", mergeIds);
      const vehicleIds = vehicles.map((row) => row.id);
      const vehicleUpdate = await updateByIds(
        supabase,
        "vehicles",
        vehicleIds,
        { customer_id: keepId },
        args.dryRun,
      );
      result.vehiclesMoved = vehicleUpdate.count;

      // 2) quotations
      const quotations = await fetchIds(supabase, "quotations", "customer_id", mergeIds);
      const quotationIds = quotations.map((row) => row.id);
      const quotationUpdate = await updateByIds(
        supabase,
        "quotations",
        quotationIds,
        { customer_id: keepId },
        args.dryRun,
      );
      result.quotationsMoved = quotationUpdate.count;

      // 3) job orders
      const jobOrders = await fetchIds(supabase, "job_orders", "customer_id", mergeIds);
      const jobOrderIds = jobOrders.map((row) => row.id);
      const jobOrderUpdate = await updateByIds(
        supabase,
        "job_orders",
        jobOrderIds,
        { customer_id: keepId },
        args.dryRun,
      );
      result.jobOrdersMoved = jobOrderUpdate.count;

      // 4) invoices / sales
      const invoices = await fetchIds(supabase, "invoices", "customer_id", mergeIds);
      const invoiceIds = invoices.map((row) => row.id);
      const invoiceUpdate = await updateByIds(
        supabase,
        "invoices",
        invoiceIds,
        { customer_id: keepId },
        args.dryRun,
      );
      result.invoicesMoved = invoiceUpdate.count;

      const sales = await fetchIds(supabase, "sales", "customer_id", mergeIds);
      const saleIds = sales.map((row) => row.id);
      const saleUpdate = await updateByIds(
        supabase,
        "sales",
        saleIds,
        { customer_id: keepId },
        args.dryRun,
      );
      result.salesMoved = saleUpdate.count;

      // 5) deactivate merge customers
      const deactivateNote = `Merged into customer ${keepId} on ${new Date().toISOString()} (likely-same approval).`;
      if (!args.dryRun) {
        for (const mergeCustomer of mergeCustomers ?? []) {
          const existingNotes = mergeCustomer.notes?.trim() || "";
          const notes = existingNotes
            ? `${existingNotes}\n${deactivateNote}`
            : deactivateNote;

          const { error } = await supabase
            .from("customers")
            .update({
              status: "inactive",
              notes,
            })
            .eq("id", mergeCustomer.id);

          if (error) {
            throw new Error(`Failed deactivating ${mergeCustomer.id}: ${error.message}`);
          }
        }
      }
      result.customersDeactivated = mergeIds.length;

      // 6) enrich KEEP blanks from merge customers
      const enrichPhone =
        !keepCustomer.contact_number &&
        (mergeCustomers ?? []).find((row) => row.contact_number)?.contact_number;
      const enrichAddress =
        !keepCustomer.address &&
        (mergeCustomers ?? []).find((row) => row.address)?.address;

      if ((enrichPhone || enrichAddress) && !args.dryRun) {
        const patch = {};
        if (enrichPhone) patch.contact_number = enrichPhone;
        if (enrichAddress) patch.address = enrichAddress;

        const { error } = await supabase.from("customers").update(patch).eq("id", keepId);
        if (error) {
          throw new Error(`Failed enriching KEEP ${keepId}: ${error.message}`);
        }
        result.keepEnriched = true;
      } else if (enrichPhone || enrichAddress) {
        result.keepEnriched = true;
      }

      // sanity: no leftover vehicles on merge ids
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
    } catch (error) {
      result.ok = false;
      result.error = error instanceof Error ? error.message : String(error);
      report.groupsFailed += 1;
    }

    report.results.push(result);
    const tag = result.ok ? "OK" : "FAIL";
    console.log(
      `[${tag}] #${group.groupNo} ${group.displayName} · vehicles ${result.vehiclesMoved} · Q ${result.quotationsMoved} · JO ${result.jobOrdersMoved}${
        result.error ? ` · ${result.error}` : ""
      }`,
    );
  }

  report.finishedAt = new Date().toISOString();

  const outJson = resolve(process.cwd(), "scripts/customer-merge-apply-likely-same-d521b15c-report.json");
  const outMd = resolve(process.cwd(), "scripts/customer-merge-apply-likely-same-d521b15c-report.md");
  writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const failed = report.results.filter((row) => !row.ok);
  const lines = [
    "# Customer merge apply report — likely-same only",
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
      `- ${row.ok ? "OK" : "FAIL"} #${row.groupNo} ${row.displayName} → KEEP \`${row.keepCustomerId}\` · V ${row.vehiclesMoved} · Q ${row.quotationsMoved} · JO ${row.jobOrdersMoved} · deactivated ${row.customersDeactivated}`,
    );
  }
  lines.push("");

  writeFileSync(outMd, `${lines.join("\n")}\n`, "utf8");
  writeFileSync("/tmp/customer-merge-apply-likely-same-d521b15c-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync("/tmp/customer-merge-apply-likely-same-d521b15c-report.md", `${lines.join("\n")}\n`, "utf8");

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
