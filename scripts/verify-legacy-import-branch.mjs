#!/usr/bin/env node

import nextEnv from "@next/env";
import { readFileSync } from "node:fs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const branchId = process.argv[2] ?? "d521b15c-c639-4c61-a1ee-6e700bb14f18";
const reportPath =
  process.argv[3] ?? "/private/tmp/legacy-car-repair-apply-d521b15c-report.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = JSON.parse(readFileSync(reportPath, "utf8"));

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = row[key] ?? "(null)";
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function blockerCounts(blockers) {
  const counts = {};
  for (const blocker of blockers) {
    counts[blocker.type] = (counts[blocker.type] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

async function fetchAll(table, select, filters = {}) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    for (const [column, value] of Object.entries(filters)) {
      if (value === true || value === false) {
        query = query.eq(column, value);
      } else if (value != null) {
        query = query.eq(column, value);
      }
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return rows;
}

const { data: branch, error: branchError } = await supabase
  .from("branches")
  .select("id, name")
  .eq("id", branchId)
  .maybeSingle();

if (branchError) {
  throw branchError;
}

if (!branch) {
  throw new Error(`Branch not found: ${branchId}`);
}

const [historicalJobOrders, quotations, customers, vehicles] = await Promise.all([
  fetchAll(
    "job_orders",
    "id, status, is_historical, service_date, quotation_id, created_at, completed_at, started_at",
    { branch_id: branchId, is_historical: true },
  ),
  fetchAll(
    "quotations",
    "id, status, created_at, approved_at, rejected_at, inspection_notes, total_amount",
    { branch_id: branchId },
  ),
  fetchAll("customers", "id", { branch_id: branchId }),
  fetchAll("vehicles", "id", { branch_id: branchId }),
]);

const importedQuotations = quotations.filter((row) =>
  String(row.inspection_notes ?? "").includes("Imported from legacy quotation record."),
);

const missingServiceDate = historicalJobOrders.filter((row) => !row.service_date);
const futureServiceDates = historicalJobOrders.filter((row) => {
  if (!row.service_date) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return row.service_date > today;
});

const serviceDateYears = {};
for (const row of historicalJobOrders) {
  const year = row.service_date ? String(row.service_date).slice(0, 4) : "(null)";
  serviceDateYears[year] = (serviceDateYears[year] || 0) + 1;
}

const quotationCreatedYears = {};
for (const row of importedQuotations) {
  const year = row.created_at
    ? new Date(row.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).slice(0, 4)
    : "(null)";
  quotationCreatedYears[year] = (quotationCreatedYears[year] || 0) + 1;
}

const linkedHistorical = historicalJobOrders.filter((row) => row.quotation_id).length;
const unlinkedHistorical = historicalJobOrders.length - linkedHistorical;

const blockers = blockerCounts(report.blockers ?? []);
const dateishBlockers = Object.fromEntries(
  Object.entries(blockers).filter(([type]) =>
    /date|status|skip|normal|future|missing|override|cap|fallback|rebuild|adjust|mismatch|infer/i.test(
      type,
    ),
  ),
);

const audit = {
  branch: { id: branch.id, name: branch.name },
  liveCounts: {
    customers: customers.length,
    vehicles: vehicles.length,
    historicalJobOrders: historicalJobOrders.length,
    quotationsTotal: quotations.length,
    quotationsImportedLegacy: importedQuotations.length,
  },
  historicalJobOrdersByStatus: countBy(historicalJobOrders, "status"),
  quotationsByStatus: {
    allBranchQuotations: countBy(quotations, "status"),
    importedLegacyQuotations: countBy(importedQuotations, "status"),
  },
  linkage: {
    historicalWithQuotationLink: linkedHistorical,
    historicalWithoutQuotationLink: unlinkedHistorical,
  },
  dates: {
    historicalMissingServiceDate: missingServiceDate.length,
    historicalFutureServiceDate: futureServiceDates.length,
    historicalServiceDateByYear: Object.fromEntries(
      Object.entries(serviceDateYears).sort((a, b) => a[0].localeCompare(b[0])),
    ),
    importedQuotationCreatedAtByYear: Object.fromEntries(
      Object.entries(quotationCreatedYears).sort((a, b) => a[0].localeCompare(b[0])),
    ),
  },
  planReport: {
    generatedAt: report.generatedAt,
    plannedSummary: report.summary,
    blockersByType: blockers,
    dateAndNormalizationBlockers: dateishBlockers,
  },
};

console.log(JSON.stringify(audit, null, 2));
