import type { TableRow } from "@/types/database";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ReportsPageData } from "@/features/reports/types";
import {
  buildPaymentMethodBreakdown,
  buildRevenueTrend,
  buildStatusBreakdown,
  buildTopPerformers,
  buildTrendBuckets,
  buildWorkflowFunnel,
  filterByIsoDateRange,
  getReportRangeBounds,
  resolveReportFilters,
} from "@/features/reports/utils";
import { roundCurrency } from "@/lib/currency";

type QuotationRow = Pick<
  TableRow<"quotations">,
  "status" | "total_amount" | "created_at" | "approved_at"
>;
type JobOrderRow = Pick<
  TableRow<"job_orders">,
  "id" | "status" | "created_at" | "released_at"
>;
type InvoiceRow = Pick<
  TableRow<"invoices">,
  "id" | "invoice_number" | "status" | "total_amount" | "balance" | "customer_id" | "created_at"
>;
type PaymentRow = Pick<TableRow<"payments">, "invoice_id" | "amount" | "payment_method" | "paid_at">;
type SaleRow = Pick<TableRow<"sales">, "id" | "total_amount" | "created_at">;
type InvoiceItemRow = Pick<
  TableRow<"invoice_items">,
  "invoice_id" | "item_type" | "description" | "quantity" | "total"
>;
type SaleItemRow = Pick<TableRow<"sale_items">, "sale_id" | "description" | "quantity" | "total">;
type InventoryStockRow = Pick<
  TableRow<"inventory_stocks">,
  "quantity_on_hand" | "available_quantity" | "reorder_level"
>;
type StockMovementRow = Pick<
  TableRow<"stock_movements">,
  "id" | "product_id" | "movement_type" | "quantity" | "created_at"
>;
type ProductRow = Pick<TableRow<"products">, "id" | "name">;
type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;

export async function getReportsPageData(input: {
  preset?: string;
  from?: string;
  to?: string;
  groupBy?: string;
}): Promise<ReportsPageData> {
  const filters = resolveReportFilters(input);
  const { fromIso, toIso } = getReportRangeBounds(filters);
  const { branchScope, supabase } = await getBranchScopedServerClient("reports:read");
  const [
    { data: quotations, error: quotationsError },
    { data: jobOrders, error: jobOrdersError },
    { data: invoices, error: invoicesError },
    { data: payments, error: paymentsError },
    { data: sales, error: salesError },
    { data: inventoryStocks, error: inventoryStocksError },
    { data: stockMovements, error: stockMovementsError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("quotations").select("status, total_amount, created_at, approved_at"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase.from("job_orders").select("id, status, created_at, released_at"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total_amount, balance, customer_id, created_at"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase.from("payments").select("invoice_id, amount, payment_method, paid_at"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase.from("sales").select("id, total_amount, created_at").eq("status", "completed"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase.from("inventory_stocks").select("quantity_on_hand, available_quantity, reorder_level"),
      branchScope.selectedBranchId,
    ),
    applyBranchFilter(
      supabase
        .from("stock_movements")
        .select("id, product_id, movement_type, quantity, created_at")
        .order("created_at", { ascending: false })
        .limit(12),
      branchScope.selectedBranchId,
    ),
  ]);

  if (quotationsError) {
    throw new Error(quotationsError.message);
  }

  if (jobOrdersError) {
    throw new Error(jobOrdersError.message);
  }

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  if (salesError) {
    throw new Error(salesError.message);
  }

  if (inventoryStocksError) {
    throw new Error(inventoryStocksError.message);
  }

  if (stockMovementsError) {
    throw new Error(stockMovementsError.message);
  }

  const quotationRows = (quotations ?? []) as QuotationRow[];
  const jobOrderRows = (jobOrders ?? []) as JobOrderRow[];
  const invoiceRows = (invoices ?? []) as InvoiceRow[];
  const paymentRows = (payments ?? []) as PaymentRow[];
  const saleRows = (sales ?? []) as SaleRow[];
  const inventoryStockRows = (inventoryStocks ?? []) as InventoryStockRow[];
  const stockMovementRows = (stockMovements ?? []) as StockMovementRow[];

  const periodQuotations = filterByIsoDateRange(quotationRows, {
    getDate: (row) => row.created_at,
    fromIso,
    toIso,
  });
  const periodApprovedQuotations = filterByIsoDateRange(quotationRows, {
    getDate: (row) => row.approved_at,
    fromIso,
    toIso,
  }).filter((row) => row.status === "approved" && row.approved_at);
  const approvedQuotationValue = sumBy(periodApprovedQuotations, (row) => row.total_amount);
  const periodJobOrders = filterByIsoDateRange(jobOrderRows, {
    getDate: (row) => row.created_at,
    fromIso,
    toIso,
  });
  const periodReleasedJobOrders = filterByIsoDateRange(jobOrderRows, {
    getDate: (row) => row.released_at,
    fromIso,
    toIso,
  });
  const periodInvoices = filterByIsoDateRange(invoiceRows, {
    getDate: (row) => row.created_at,
    fromIso,
    toIso,
  });
  const periodPayments = filterByIsoDateRange(paymentRows, {
    getDate: (row) => row.paid_at,
    fromIso,
    toIso,
  });
  const periodSales = filterByIsoDateRange(saleRows, {
    getDate: (row) => row.created_at,
    fromIso,
    toIso,
  });

  const periodInvoiceIds = periodInvoices.map((row) => row.id);
  const periodSaleIds = periodSales.map((row) => row.id);

  const [invoiceItems, saleItems] = await Promise.all([
    getInvoiceItems(periodInvoiceIds),
    getSaleItems(periodSaleIds),
  ]);

  const serviceInvoiceItems = invoiceItems.filter(
    (item) => item.item_type === "service" || item.item_type === "labor",
  );
  const productInvoiceItems = invoiceItems.filter((item) => item.item_type === "product");

  const servicesRendered = sumBy(serviceInvoiceItems, (item) => item.quantity);
  const averageInvoiceValue =
    periodInvoices.length > 0
      ? roundCurrency(sumBy(periodInvoices, (row) => row.total_amount) / periodInvoices.length)
      : 0;


  const unpaidInvoices = invoiceRows.filter(isUnpaidInvoice);
  const unpaidCustomerIds = [
    ...new Set(unpaidInvoices.flatMap((invoice) => (invoice.customer_id ? [invoice.customer_id] : []))),
  ];
  const stockMovementProductIds = [...new Set(stockMovementRows.map((movement) => movement.product_id))];
  const [customerMap, productMap] = await Promise.all([
    getCustomerNameMap(unpaidCustomerIds),
    getProductNameMap(stockMovementProductIds),
  ]);

  const trendBuckets = buildTrendBuckets(filters);

  return {
    filters,
    periodPerformanceMetrics: [
      {
        label: "Approved quotation value",
        value: approvedQuotationValue,
        kind: "currency",
        helper: `${periodApprovedQuotations.length} quotation${periodApprovedQuotations.length === 1 ? "" : "s"} approved in range`,
        tone: "success",
      },
      {
        label: "Invoiced value",
        value: sumBy(periodInvoices, (row) => row.total_amount),
        kind: "currency",
        helper: `${periodInvoices.length} invoice${periodInvoices.length === 1 ? "" : "s"} created in range`,
      },
      {
        label: "Quotation value",
        value: sumBy(periodQuotations, (row) => row.total_amount),
        kind: "currency",
        helper: `${periodQuotations.length} quotation${periodQuotations.length === 1 ? "" : "s"} created in range`,
      },
      {
        label: "Job orders opened",
        value: periodJobOrders.length,
        kind: "count",
        helper: `${periodReleasedJobOrders.length} released in the same period`,
      },
      {
        label: "Vehicles released",
        value: periodReleasedJobOrders.length,
        kind: "count",
        helper: "Counted from job orders released in the selected range",
      },
      {
        label: "Services rendered",
        value: servicesRendered,
        kind: "quantity",
        helper: "Based on invoiced service and labor line quantities",
      },
      {
        label: "Average invoice value",
        value: averageInvoiceValue,
        kind: "currency",
        helper: periodInvoices.length > 0 ? "Calculated from invoices in this period" : "No invoices in this period",
      },
      {
        label: "POS sales value",
        value: sumBy(periodSales, (row) => row.total_amount),
        kind: "currency",
        helper: `${periodSales.length} completed sale${periodSales.length === 1 ? "" : "s"} in range`,
      },
    ],
    operationalAlerts: [
      {
        label: "Open job orders",
        value: jobOrderRows.filter((row) => !["released", "cancelled"].includes(row.status)).length,
        kind: "count",
        helper: "Current active workload across the shop",
        tone: "warning",
      },
      {
        label: "Unpaid invoices",
        value: unpaidInvoices.length,
        kind: "count",
        helper: "Outstanding receivables that still need collection",
        tone: unpaidInvoices.length > 0 ? "warning" : "success",
      },
      {
        label: "Low stock items",
        value: inventoryStockRows.filter(
          (row) => row.reorder_level !== null && row.available_quantity <= row.reorder_level,
        ).length,
        kind: "count",
        helper: "Available quantity is at or below reorder level",
        tone: "warning",
      },
      {
        label: "Out of stock items",
        value: inventoryStockRows.filter((row) => row.available_quantity <= 0).length,
        kind: "count",
        helper: "Items with no available quantity right now",
        tone: "danger",
      },
      {
        label: "Current on-hand quantity",
        value: sumBy(inventoryStockRows, (row) => row.quantity_on_hand),
        kind: "quantity",
        helper: "Live quantity on hand across all stocked items",
        tone: "info",
      },
    ],
    revenueTrend: buildRevenueTrend({
      buckets: trendBuckets,
      approvedQuotations: periodApprovedQuotations,
      releases: periodReleasedJobOrders,
      getApprovedDate: (row) => row.approved_at ?? "",
      getApprovedAmount: (row) => row.total_amount,
      getReleaseDate: (row) => row.released_at ?? "",
    }),
    workflowFunnel: buildWorkflowFunnel({
      quotationsCreated: periodQuotations.length,
      quotationsApproved: periodApprovedQuotations.length,
      approvedQuotationValue,
      jobOrdersOpened: periodJobOrders.length,
      vehiclesReleased: periodReleasedJobOrders.length,
    }),
    topServices: buildTopPerformers(
      serviceInvoiceItems.map((item) => ({
        label: item.description,
        quantity: item.quantity,
        amount: item.total,
      })),
    ),
    topProducts: buildTopPerformers([
      ...productInvoiceItems.map((item) => ({
        label: item.description,
        quantity: item.quantity,
        amount: item.total,
      })),
      ...saleItems.map((item) => ({
        label: item.description,
        quantity: item.quantity,
        amount: item.total,
      })),
    ]),
    quotationStatusBreakdown: buildStatusBreakdown(periodQuotations.map((row) => row.status)),
    periodJobOrderStatusBreakdown: buildStatusBreakdown(periodJobOrders.map((row) => row.status)),
    liveJobOrderStatusBreakdown: buildStatusBreakdown(jobOrderRows.map((row) => row.status)),
    paymentMethodBreakdown: buildPaymentMethodBreakdown(
      periodPayments.map((row) => ({
        paymentMethod: row.payment_method,
        amount: row.amount,
      })),
    ),
    unpaidInvoices: unpaidInvoices
      .map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_id
          ? customerMap.get(invoice.customer_id) ?? "Unknown customer"
          : "Walk-in customer",
        totalAmount: invoice.total_amount,
        balance: invoice.balance,
        status: invoice.status,
        createdAt: invoice.created_at,
      }))
      .sort((left, right) => right.balance - left.balance),
    recentStockMovements: stockMovementRows.map((movement) => ({
      id: movement.id,
      productName: productMap.get(movement.product_id) ?? "Unknown product",
      movementType: movement.movement_type,
      quantity: movement.quantity,
      createdAt: movement.created_at,
    })),
  };
}

async function getCustomerNameMap(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("customers").select("id, display_name").in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as CustomerRow[]).map((row) => [row.id, row.display_name]));
}

async function getProductNameMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("id, name").in("id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as ProductRow[]).map((row) => [row.id, row.name]));
}

async function getInvoiceItems(invoiceIds: string[]) {
  if (invoiceIds.length === 0) {
    return [] as InvoiceItemRow[];
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoice_items")
    .select("invoice_id, item_type, description, quantity, total")
    .in("invoice_id", invoiceIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InvoiceItemRow[];
}

async function getSaleItems(saleIds: string[]) {
  if (saleIds.length === 0) {
    return [] as SaleItemRow[];
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sale_items")
    .select("sale_id, description, quantity, total")
    .in("sale_id", saleIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SaleItemRow[];
}

function sumBy<T>(rows: T[], selector: (row: T) => number) {
  return roundCurrency(rows.reduce((sum, row) => sum + selector(row), 0));
}
function isUnpaidInvoice(
  invoice: InvoiceRow,
): invoice is InvoiceRow & { status: "unpaid" | "partially_paid" } {
  return invoice.status === "unpaid" || invoice.status === "partially_paid";
}
