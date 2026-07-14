#!/usr/bin/env node

/**
 * Merge the last two active Mandurriao duplicate-name pairs.
 * Preserves document dates/history; only reassigns ownership FKs.
 */

import { createClient } from "@supabase/supabase-js";

const BRANCH_ID = "d521b15c-c639-4c61-a1ee-6e700bb14f18";

const GROUPS = [
  {
    name: "Lemuel Montano",
    // KEEP: has phone + more quotations; display name Montaño
    keepId: "f448d8e4-5921-4275-a94e-fb200ae1c59b",
    mergeIds: ["756d8238-4a3c-4d79-b4f4-0422c37f2593"],
    preferDisplayName: "Lemuel Montaño",
  },
  {
    name: "Ma Esperanza Alvarez",
    // KEEP: more quotations + job orders
    keepId: "97b67ff7-b0d3-4edc-9f90-616f6e1d8e7a",
    mergeIds: ["1fa76b64-4b5a-4372-824b-3a5c08112dc2"],
    preferDisplayName: "Ma. Esperanza Alvarez",
  },
];

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function normalizePhone(value) {
  return (value ?? "").replace(/\D+/g, "");
}

function normalizeAddress(value) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePlate(value) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function normalizeName(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function updateByIds(supabase, table, ids, payload) {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase.from(table).update(payload, { count: "exact" }).in("id", ids);
  if (error) throw new Error(`${table} update failed: ${error.message}`);
  return count ?? ids.length;
}

async function fetchIds(supabase, table, column, values) {
  if (values.length === 0) return [];
  const { data, error } = await supabase.from(table).select("id").in(column, values);
  if (error) throw new Error(`${table} fetch failed: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

function buildEnrichment(keep, merges) {
  const patch = {};
  const noteParts = [];
  const keepPhone = normalizePhone(keep.contact_number);
  const keepSecondary = normalizePhone(keep.contact_number_secondary);
  const keepAddress = normalizeAddress(keep.address);
  const phones = [];

  for (const merge of merges) {
    const phone = merge.contact_number?.trim();
    if (!phone) continue;
    const normalized = normalizePhone(phone);
    if (!normalized || normalized === keepPhone || normalized === keepSecondary) continue;
    if (!phones.some((entry) => normalizePhone(entry) === normalized)) phones.push(phone);
  }

  if (!keep.contact_number && phones.length > 0) patch.contact_number = phones.shift();
  if (!keep.contact_number_secondary && phones.length > 0) {
    patch.contact_number_secondary = phones.shift();
  }
  for (const phone of phones) {
    noteParts.push(`Alternate contact number preserved from merge: ${phone}`);
  }

  if (!keep.address) {
    const firstAddress = merges.find((row) => row.address?.trim())?.address?.trim();
    if (firstAddress) patch.address = firstAddress;
  }

  for (const merge of merges) {
    const address = merge.address?.trim();
    if (!address) continue;
    const normalized = normalizeAddress(address);
    if (!normalized || normalized === keepAddress || normalized === normalizeAddress(patch.address)) {
      continue;
    }
    noteParts.push(`Alternate address preserved from merge: ${address}`);
  }

  if (noteParts.length > 0) {
    const existing = keep.notes?.trim() || "";
    const addition = noteParts.join("\n");
    patch.notes = existing ? `${existing}\n${addition}` : addition;
  }

  return patch;
}

async function mergeGroup(supabase, group) {
  const { data: keep, error: keepError } = await supabase
    .from("customers")
    .select("id, display_name, contact_number, contact_number_secondary, address, notes, status")
    .eq("id", group.keepId)
    .maybeSingle();

  if (keepError) throw new Error(keepError.message);
  if (!keep) throw new Error(`KEEP missing: ${group.keepId}`);

  const { data: merges, error: mergeError } = await supabase
    .from("customers")
    .select("id, display_name, contact_number, contact_number_secondary, address, notes, status")
    .in("id", group.mergeIds);

  if (mergeError) throw new Error(mergeError.message);
  if ((merges ?? []).length !== group.mergeIds.length) {
    throw new Error(`One or more MERGE customers missing for ${group.name}`);
  }

  const { data: keepVehicles, error: keepVehicleError } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, status")
    .eq("customer_id", group.keepId);

  if (keepVehicleError) throw new Error(keepVehicleError.message);

  const { data: mergeVehicles, error: mergeVehicleError } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, status")
    .in("customer_id", group.mergeIds);

  if (mergeVehicleError) throw new Error(mergeVehicleError.message);

  let vehiclesMoved = 0;
  let vehiclesLinkedViaPlate = 0;
  let quotationsRehomedWithVehicle = 0;
  let jobOrdersRehomedWithVehicle = 0;

  for (const mergeVehicle of mergeVehicles ?? []) {
    const normalizedPlate = normalizePlate(mergeVehicle.plate_number);
    const keepMatch = (keepVehicles ?? []).find(
      (vehicle) => normalizePlate(vehicle.plate_number) === normalizedPlate && Boolean(normalizedPlate),
    );

    if (keepMatch) {
      const { data: quotations } = await supabase
        .from("quotations")
        .select("id")
        .eq("vehicle_id", mergeVehicle.id);
      const { data: jobOrders } = await supabase
        .from("job_orders")
        .select("id")
        .eq("vehicle_id", mergeVehicle.id);
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("vehicle_id", mergeVehicle.id);

      for (const quotation of quotations ?? []) {
        const { error } = await supabase
          .from("quotations")
          .update({ vehicle_id: keepMatch.id, customer_id: group.keepId })
          .eq("id", quotation.id);
        if (error) throw new Error(`quotation rehome ${quotation.id}: ${error.message}`);
        quotationsRehomedWithVehicle += 1;
      }

      for (const jobOrder of jobOrders ?? []) {
        const { error } = await supabase
          .from("job_orders")
          .update({ vehicle_id: keepMatch.id, customer_id: group.keepId })
          .eq("id", jobOrder.id);
        if (error) throw new Error(`job order rehome ${jobOrder.id}: ${error.message}`);
        jobOrdersRehomedWithVehicle += 1;
      }

      for (const invoice of invoices ?? []) {
        const { error } = await supabase
          .from("invoices")
          .update({ vehicle_id: keepMatch.id, customer_id: group.keepId })
          .eq("id", invoice.id);
        if (error) throw new Error(`invoice rehome ${invoice.id}: ${error.message}`);
      }

      const { error: deactivateVehicleError } = await supabase
        .from("vehicles")
        .update({
          status: "inactive",
        })
        .eq("id", mergeVehicle.id);

      if (deactivateVehicleError) {
        throw new Error(`vehicle deactivate ${mergeVehicle.id}: ${deactivateVehicleError.message}`);
      }

      vehiclesLinkedViaPlate += 1;
    } else {
      const { error } = await supabase
        .from("vehicles")
        .update({ customer_id: group.keepId })
        .eq("id", mergeVehicle.id);
      if (error) throw new Error(`vehicle move ${mergeVehicle.id}: ${error.message}`);
      vehiclesMoved += 1;
    }
  }

  const quotationIds = await fetchIds(supabase, "quotations", "customer_id", group.mergeIds);
  const jobOrderIds = await fetchIds(supabase, "job_orders", "customer_id", group.mergeIds);
  const invoiceIds = await fetchIds(supabase, "invoices", "customer_id", group.mergeIds);
  const saleIds = await fetchIds(supabase, "sales", "customer_id", group.mergeIds);

  const quotationsMoved = await updateByIds(supabase, "quotations", quotationIds, {
    customer_id: group.keepId,
  });
  const jobOrdersMoved = await updateByIds(supabase, "job_orders", jobOrderIds, {
    customer_id: group.keepId,
  });
  const invoicesMoved = await updateByIds(supabase, "invoices", invoiceIds, {
    customer_id: group.keepId,
  });
  const salesMoved = await updateByIds(supabase, "sales", saleIds, {
    customer_id: group.keepId,
  });

  const deactivateNote = `Merged into customer ${group.keepId} on ${new Date().toISOString()} (remaining-duplicate approval). Legacy document dates and repair history were preserved.`;
  for (const merge of merges ?? []) {
    const notes = merge.notes?.trim() ? `${merge.notes.trim()}\n${deactivateNote}` : deactivateNote;
    const { error } = await supabase
      .from("customers")
      .update({ status: "inactive", notes })
      .eq("id", merge.id);
    if (error) throw new Error(`deactivate ${merge.id}: ${error.message}`);
  }

  const enrichment = buildEnrichment(keep, merges ?? []);
  if (group.preferDisplayName && group.preferDisplayName !== keep.display_name) {
    enrichment.display_name = group.preferDisplayName;
  }

  if (Object.keys(enrichment).length > 0) {
    const { error } = await supabase.from("customers").update(enrichment).eq("id", group.keepId);
    if (error) throw new Error(`enrich ${group.keepId}: ${error.message}`);
  }

  // Rehome any leftover vehicles still owned by MERGE (e.g. inactivated plate twins)
  const leftoverVehicleIds = await fetchIds(supabase, "vehicles", "customer_id", group.mergeIds);
  const inactiveVehiclesRehomed = await updateByIds(supabase, "vehicles", leftoverVehicleIds, {
    customer_id: group.keepId,
  });

  return {
    name: group.name,
    keepId: group.keepId,
    mergeIds: group.mergeIds,
    vehiclesMoved,
    vehiclesLinkedViaPlate,
    quotationsRehomedWithVehicle,
    jobOrdersRehomedWithVehicle,
    quotationsMoved,
    jobOrdersMoved,
    invoicesMoved,
    salesMoved,
    customersDeactivated: group.mergeIds.length,
    inactiveVehiclesRehomed,
    enrichment,
  };
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const results = [];
  for (const group of GROUPS) {
    const result = await mergeGroup(supabase, group);
    results.push(result);
    console.log(
      `[OK] ${result.name} · V moved ${result.vehiclesMoved} · plate-linked ${result.vehiclesLinkedViaPlate} · Q ${result.quotationsMoved}+${result.quotationsRehomedWithVehicle} · JO ${result.jobOrdersMoved}+${result.jobOrdersRehomedWithVehicle}`,
    );
  }

  const { data: active, error: activeError } = await supabase
    .from("customers")
    .select("id, display_name")
    .eq("branch_id", BRANCH_ID)
    .eq("status", "active");

  if (activeError) throw new Error(activeError.message);

  const groups = new Map();
  for (const row of active ?? []) {
    const key = normalizeName(row.display_name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row.display_name);
  }

  const remainingDuplicates = [...groups.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([key, names]) => ({ key, count: names.length, names }));

  console.log(
    JSON.stringify(
      {
        results,
        activeCustomers: active?.length ?? 0,
        remainingActiveDuplicateNameGroups: remainingDuplicates.length,
        remainingDuplicates,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
