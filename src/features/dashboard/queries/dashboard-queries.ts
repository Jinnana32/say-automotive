import { DateTime } from "luxon";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getBusinessNow } from "@/lib/dates";
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
type PaymentRow = Pick<TableRow<"payments">, "amount" | "paid_at">;

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
  revenueTrend: Array<{
    label: string;
    value: number;
  }>;
  serviceTrend: Array<{
    label: string;
    value: number;
  }>;
};

export async function getDashboardData(): Promise<DashboardData> {
  const { context, supabase } = await getAuthorizedSupabaseServerClient("dashboard:view");

  const [
    totalCustomers,
    totalVehicles,
    pendingQuotations,
    activeJobOrders,
    lowStockItems,
    unpaidInvoicesCount,
  ] = await Promise.all([
    getExactCount(supabase.from("customers").select("*", { count: "exact", head: true })),
    getExactCount(supabase.from("vehicles").select("*", { count: "exact", head: true })),
    context.capabilities.includes("quotations:read")
      ? getExactCount(
          supabase
            .from("quotations")
            .select("*", { count: "exact", head: true })
            .in("status", ["draft", "pending_approval"]),
        )
      : Promise.resolve(0),
    context.capabilities.includes("job_orders:read")
      ? getExactCount(
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
        )
      : Promise.resolve(0),
    context.capabilities.includes("inventory:read")
      ? getInventoryLowStockCount(supabase)
      : Promise.resolve(0),
    context.capabilities.includes("invoices:read")
      ? getExactCount(
          supabase
            .from("invoices")
            .select("*", { count: "exact", head: true })
            .gt("balance", 0)
            .neq("status", "cancelled"),
        )
      : Promise.resolve(0),
  ]);

  const [recentQuotations, recentJobOrders, inventoryAlerts, unpaidInvoices, revenueTrend, serviceTrend] =
    await Promise.all([
      context.capabilities.includes("quotations:read")
        ? getRecentQuotations(supabase)
        : Promise.resolve([]),
      context.capabilities.includes("job_orders:read")
        ? getRecentJobOrders(supabase)
        : Promise.resolve([]),
      context.capabilities.includes("inventory:read")
        ? getInventoryAlerts(supabase)
        : Promise.resolve([]),
      context.capabilities.includes("invoices:read")
        ? getUnpaidInvoices(supabase)
        : Promise.resolve([]),
      context.capabilities.includes("payments:read")
        ? getRevenueTrend(supabase)
        : Promise.resolve([]),
      context.capabilities.includes("job_orders:read")
        ? getServiceTrend(supabase)
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
    revenueTrend,
    serviceTrend,
  };
}

async function getRecentQuotations(
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const { data, error } = await supabase
    .from("quotations")
    .select("id, quotation_number, customer_id, status, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const { data, error } = await supabase
    .from("job_orders")
    .select("id, job_order_number, customer_id, vehicle_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const { data, error } = await supabase
    .from("inventory_stocks")
    .select("product_id, available_quantity, reorder_level")
    .not("reorder_level", "is", null)
    .order("available_quantity", { ascending: true })
    .limit(8);

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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_id, status, balance")
    .gt("balance", 0)
    .neq("status", "cancelled")
    .order("balance", { ascending: false })
    .limit(5);

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

async function getRevenueTrend(
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const start = getBusinessNow().startOf("month").minus({ months: 5 });
  const { data, error } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .gte("paid_at", start.toUTC().toISO());

  if (error) {
    throw new Error(error.message);
  }

  const paymentRows = (data ?? []) as PaymentRow[];
  return buildMonthlySeries(start, 6, (monthStart, monthEnd) =>
    paymentRows
      .filter((row) => {
        const paidAt = DateTime.fromISO(row.paid_at).setZone("Asia/Manila");
        return paidAt >= monthStart && paidAt < monthEnd;
      })
      .reduce((sum, row) => sum + row.amount, 0),
  );
}

async function getServiceTrend(
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const start = getBusinessNow().startOf("month").minus({ months: 5 });
  const { data, error } = await supabase
    .from("job_orders")
    .select("id, created_at, status")
    .gte("created_at", start.toUTC().toISO())
    .in("status", ["completed", "ready_for_billing", "paid", "released"]);

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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
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
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
) {
  const { data, error } = await supabase
    .from("inventory_stocks")
    .select("available_quantity, reorder_level")
    .not("reorder_level", "is", null);

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
