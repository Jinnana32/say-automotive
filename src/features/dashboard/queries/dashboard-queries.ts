import { DateTime } from "luxon";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { getBusinessNow } from "@/lib/dates";
import type { RevenueTrendPoint } from "@/features/reports/types";
import { buildRevenueTrend, buildTrendBuckets } from "@/features/reports/utils";
import type { TableRow } from "@/types/database";

type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type VehicleRow = Pick<TableRow<"vehicles">, "id" | "make" | "model" | "plate_number">;
type ProductRow = Pick<TableRow<"products">, "id" | "name" | "sku">;

type QuotationRow = Pick<
  TableRow<"quotations">,
  "id" | "quotation_number" | "customer_id" | "status" | "total_amount" | "created_at"
>;
type JobOrderRow = Pick<
  TableRow<"job_orders">,
  "id" | "job_order_number" | "customer_id" | "vehicle_id" | "status" | "created_at"
>;
type InvoiceRow = Pick<
  TableRow<"invoices">,
  "id" | "invoice_number" | "customer_id" | "status" | "balance"
>;
type InventoryStockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "reorder_level"
>;
type QuotationTrendRow = Pick<
  TableRow<"quotations">,
  "status" | "total_amount" | "approved_at"
>;
type JobOrderReleaseRow = Pick<TableRow<"job_orders">, "released_at">;

export type DashboardData = {
  metrics: {
    totalCustomers: number;
    totalVehicles: number;
    pendingQuotations: number;
    activeJobOrders: number;
    lowStockItems: number;
    unpaidInvoices: number;
  };
  recentQuotations: Array<{
    id: string;
    quotationNumber: string;
    customerName: string;
    totalAmount: number;
    status: TableRow<"quotations">["status"];
    createdAt: string;
  }>;
  recentJobOrders: Array<{
    id: string;
    jobOrderNumber: string;
    customerName: string;
    vehicleLabel: string;
    status: TableRow<"job_orders">["status"];
    createdAt: string;
  }>;
  inventoryAlerts: Array<{
    productId: string;
    productName: string;
    sku: string | null;
    availableQuantity: number;
    reorderLevel: number | null;
  }>;
  unpaidInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    status: TableRow<"invoices">["status"];
    balance: number;
  }>;
  quotationAndServiceTrend: RevenueTrendPoint[];
  serviceTrend: Array<{
    label: string;
    value: number;
  }>;
};

export async function getDashboardData(): Promise<DashboardData> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("dashboard:view");

  const [
    totalCustomers,
    totalVehicles,
    pendingQuotations,
    activeJobOrders,
    lowStockItems,
    unpaidInvoicesCount,
  ] = await Promise.all([
    getExactCount(
      applyBranchFilter(
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("status", "active"),
        branchScope.selectedBranchId,
      ),
    ),
    getExactCount(
      applyBranchFilter(
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        branchScope.selectedBranchId,
      ),
    ),
    context.capabilities.includes("quotations:read")
      ? getExactCount(
          applyBranchFilter(
            supabase
            .from("quotations")
            .select("*", { count: "exact", head: true })
            .in("status", ["draft", "pending_approval"]),
            branchScope.selectedBranchId,
          ),
        )
      : Promise.resolve(0),
    context.capabilities.includes("job_orders:read")
      ? getExactCount(
          applyBranchFilter(
            supabase
            .from("job_orders")
            .select("*", { count: "exact", head: true })
            .in("status", [
              "pending",
              "in_progress",
              "waiting_for_parts",
              "waiting_for_customer_approval",
              "completed",
              "ready_for_billing",
            ]),
            branchScope.selectedBranchId,
          ),
        )
      : Promise.resolve(0),
    context.capabilities.includes("inventory:read")
      ? getInventoryLowStockCount(supabase, branchScope.selectedBranchId)
      : Promise.resolve(0),
    context.capabilities.includes("invoices:read")
      ? getExactCount(
          applyBranchFilter(
            supabase
            .from("invoices")
            .select("*", { count: "exact", head: true })
            .gt("balance", 0)
            .neq("status", "cancelled"),
            branchScope.selectedBranchId,
          ),
        )
      : Promise.resolve(0),
  ]);

  const [recentQuotations, recentJobOrders, inventoryAlerts, unpaidInvoices, quotationAndServiceTrend, serviceTrend] =
    await Promise.all([
      context.capabilities.includes("quotations:read")
        ? getRecentQuotations(supabase, branchScope.selectedBranchId)
        : Promise.resolve([]),
      context.capabilities.includes("job_orders:read")
        ? getRecentJobOrders(supabase, branchScope.selectedBranchId)
        : Promise.resolve([]),
      context.capabilities.includes("inventory:read")
        ? getInventoryAlerts(supabase, branchScope.selectedBranchId)
        : Promise.resolve([]),
      context.capabilities.includes("invoices:read")
        ? getUnpaidInvoices(supabase, branchScope.selectedBranchId)
        : Promise.resolve([]),
      context.capabilities.includes("quotations:read")
        ? getQuotationAndServiceTrend(
            supabase,
            branchScope.selectedBranchId,
            context.capabilities.includes("job_orders:read"),
          )
        : Promise.resolve([]),
      context.capabilities.includes("job_orders:read")
        ? getServiceTrend(supabase, branchScope.selectedBranchId)
        : Promise.resolve([]),
    ]);

  return {
    metrics: {
      totalCustomers,
      totalVehicles,
      pendingQuotations,
      activeJobOrders,
      lowStockItems,
      unpaidInvoices: unpaidInvoicesCount,
    },
    recentQuotations,
    recentJobOrders,
    inventoryAlerts,
    unpaidInvoices,
    quotationAndServiceTrend,
    serviceTrend,
  };
}

async function getRecentQuotations(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const { data, error } = await applyBranchFilter(
    supabase
    .from("quotations")
    .select("id, quotation_number, customer_id, status, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(5),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const quotationRows = (data ?? []) as QuotationRow[];
  const customerMap = await getCustomerNameMap(
    supabase,
    quotationRows.map((row) => row.customer_id),
  );

  return quotationRows.map((row) => ({
    id: row.id,
    quotationNumber: row.quotation_number,
    customerName: customerMap.get(row.customer_id) ?? "Unknown customer",
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function getRecentJobOrders(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const { data, error } = await applyBranchFilter(
    supabase
    .from("job_orders")
    .select("id, job_order_number, customer_id, vehicle_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as JobOrderRow[];
  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap(
      supabase,
      rows.map((row) => row.customer_id),
    ),
    getVehicleLabelMap(
      supabase,
      rows.map((row) => row.vehicle_id),
    ),
  ]);

  return rows.map((row) => ({
    id: row.id,
    jobOrderNumber: row.job_order_number,
    customerName: customerMap.get(row.customer_id) ?? "Unknown customer",
    vehicleLabel: vehicleMap.get(row.vehicle_id) ?? "Unknown vehicle",
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function getInventoryAlerts(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const { data, error } = await applyBranchFilter(
    supabase
    .from("inventory_stocks")
    .select("product_id, available_quantity, reorder_level")
    .not("reorder_level", "is", null)
    .order("available_quantity", { ascending: true })
    .limit(8),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const stockRows = ((data ?? []) as InventoryStockRow[]).filter(
    (row) => row.reorder_level !== null && row.available_quantity <= row.reorder_level,
  );
  const productMap = await getProductMap(
    supabase,
    stockRows.map((row) => row.product_id),
  );

  return stockRows.map((row) => ({
    productId: row.product_id,
    productName: productMap.get(row.product_id)?.name ?? "Unknown product",
    sku: productMap.get(row.product_id)?.sku ?? null,
    availableQuantity: row.available_quantity,
    reorderLevel: row.reorder_level,
  }));
}

async function getUnpaidInvoices(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const { data, error } = await applyBranchFilter(
    supabase
    .from("invoices")
    .select("id, invoice_number, customer_id, status, balance")
    .gt("balance", 0)
    .neq("status", "cancelled")
    .order("balance", { ascending: false })
    .limit(5),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as InvoiceRow[];
  const customerMap = await getCustomerNameMap(
    supabase,
    rows.flatMap((row) => (row.customer_id ? [row.customer_id] : [])),
  );

  return rows.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerName: row.customer_id
      ? customerMap.get(row.customer_id) ?? "Unknown customer"
      : "Walk-in customer",
    status: row.status,
    balance: row.balance,
  }));
}

async function getQuotationAndServiceTrend(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
  includeReleases: boolean,
) {
  const now = getBusinessNow();
  const from = now.startOf("month").minus({ months: 5 });
  const to = now.endOf("day");
  const trendFilters = {
    from: from.toISODate() ?? "",
    to: to.toISODate() ?? "",
    groupBy: "monthly" as const,
  };
  const buckets = buildTrendBuckets(trendFilters);
  const rangeStartIso = from.toUTC().toISO() ?? "";

  const [quotationsResult, jobOrdersResult] = await Promise.all([
    applyBranchFilter(
      supabase
        .from("quotations")
        .select("status, total_amount, approved_at")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .gte("approved_at", rangeStartIso),
      branchId,
    ),
    includeReleases
      ? applyBranchFilter(
          supabase
            .from("job_orders")
            .select("released_at")
            .not("released_at", "is", null)
            .gte("released_at", rangeStartIso),
          branchId,
        )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (quotationsResult.error) {
    throw new Error(quotationsResult.error.message);
  }

  if (jobOrdersResult.error) {
    throw new Error(jobOrdersResult.error.message);
  }

  const approvedQuotations = (quotationsResult.data ?? []) as QuotationTrendRow[];
  const releasedJobOrders = (jobOrdersResult.data ?? []) as JobOrderReleaseRow[];

  return buildRevenueTrend({
    buckets,
    approvedQuotations,
    releases: releasedJobOrders,
    getApprovedDate: (row) => row.approved_at ?? "",
    getApprovedAmount: (row) => row.total_amount,
    getReleaseDate: (row) => row.released_at ?? "",
  });
}

async function getServiceTrend(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const start = getBusinessNow().startOf("month").minus({ months: 5 });
  const { data, error } = await applyBranchFilter(
    supabase
    .from("job_orders")
    .select("id, created_at, status")
    .gte("created_at", start.toUTC().toISO())
    .in("status", ["completed", "ready_for_billing", "paid", "released"]),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Pick<TableRow<"job_orders">, "created_at">[];
  return buildMonthlySeries(start, 6, (monthStart, monthEnd) =>
    rows.filter((row) => {
      const createdAt = DateTime.fromISO(row.created_at).setZone("Asia/Manila");
      return createdAt >= monthStart && createdAt < monthEnd;
    }).length,
  );
}

function buildMonthlySeries(
  start: DateTime,
  monthCount: number,
  getValue: (monthStart: DateTime, monthEnd: DateTime) => number,
) {
  return Array.from({ length: monthCount }, (_, index) => {
    const monthStart = start.plus({ months: index });
    const monthEnd = monthStart.plus({ months: 1 });

    return {
      label: monthStart.toFormat("LLL"),
      value: getValue(monthStart, monthEnd),
    };
  });
}

async function getCustomerNameMap(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  customerIds: string[],
) {
  const uniqueIds = [...new Set(customerIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.from("customers").select("id, display_name").in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as CustomerRow[]).map((row) => [row.id, row.display_name]));
}

async function getVehicleLabelMap(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  vehicleIds: string[],
) {
  const uniqueIds = [...new Set(vehicleIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, plate_number")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as VehicleRow[]).map((row) => [
      row.id,
      `${row.make} ${row.model}${row.plate_number ? ` · ${row.plate_number}` : ""}`,
    ]),
  );
}

async function getProductMap(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  productIds: string[],
) {
  const uniqueIds = [...new Set(productIds)];

  if (uniqueIds.length === 0) {
    return new Map<string, ProductRow>();
  }

  const { data, error } = await supabase.from("products").select("id, name, sku").in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as ProductRow[]).map((row) => [row.id, row]));
}

async function getInventoryLowStockCount(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string | null,
) {
  const { data, error } = await applyBranchFilter(
    supabase
    .from("inventory_stocks")
    .select("available_quantity, reorder_level")
    .not("reorder_level", "is", null),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Pick<InventoryStockRow, "available_quantity" | "reorder_level">[]).filter(
    (row) => row.reorder_level !== null && row.available_quantity <= row.reorder_level,
  ).length;
}

async function getExactCount(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
