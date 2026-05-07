import type { TableRow } from "@/types/database";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getBusinessNow } from "@/lib/dates";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ReportsPageData, ReportWindow } from "@/features/reports/types";
import {
  buildPaymentMethodBreakdown,
  buildStatusBreakdown,
  filterByIsoDate,
  getReportWindowStart,
} from "@/features/reports/utils";

type QuotationRow = Pick<TableRow<"quotations">, "status" | "total_amount" | "created_at">;
type JobOrderRow = Pick<
  TableRow<"job_orders">,
  "status" | "created_at" | "released_at"
>;
type InvoiceRow = Pick<
  TableRow<"invoices">,
  "id" | "invoice_number" | "status" | "total_amount" | "balance" | "customer_id" | "created_at"
>;
type PaymentRow = Pick<TableRow<"payments">, "amount" | "payment_method" | "paid_at">;
type SaleRow = Pick<TableRow<"sales">, "total_amount" | "created_at">;
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

export async function getReportsPageData(window: ReportWindow): Promise<ReportsPageData> {
  const { supabase } = await getAuthorizedSupabaseServerClient("reports:read");
  const [
    { data: quotations, error: quotationsError },
    { data: jobOrders, error: jobOrdersError },
    { data: invoices, error: invoicesError },
    { data: payments, error: paymentsError },
    { data: sales, error: salesError },
    { data: inventoryStocks, error: inventoryStocksError },
    { data: stockMovements, error: stockMovementsError },
  ] = await Promise.all([
    supabase.from("quotations").select("status, total_amount, created_at"),
    supabase.from("job_orders").select("status, created_at, released_at"),
    supabase.from("invoices").select("id, invoice_number, status, total_amount, balance, customer_id, created_at"),
    supabase.from("payments").select("amount, payment_method, paid_at"),
    supabase.from("sales").select("total_amount, created_at").eq("status", "completed"),
    supabase.from("inventory_stocks").select("quantity_on_hand, available_quantity, reorder_level"),
    supabase
      .from("stock_movements")
      .select("id, product_id, movement_type, quantity, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
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

  const nowIso = getBusinessNow().toISO() ?? new Date().toISOString();
  const windowStartIso = getReportWindowStart(window, nowIso);
  const quotationRows = (quotations ?? []) as QuotationRow[];
  const jobOrderRows = (jobOrders ?? []) as JobOrderRow[];
  const invoiceRows = (invoices ?? []) as InvoiceRow[];
  const paymentRows = (payments ?? []) as PaymentRow[];
  const saleRows = (sales ?? []) as SaleRow[];
  const inventoryStockRows = (inventoryStocks ?? []) as InventoryStockRow[];
  const stockMovementRows = (stockMovements ?? []) as StockMovementRow[];

  const periodQuotations = filterByIsoDate(quotationRows, {
    getDate: (row) => row.created_at,
    windowStartIso,
  });
  const periodJobOrders = filterByIsoDate(jobOrderRows, {
    getDate: (row) => row.created_at,
    windowStartIso,
  });
  const periodReleasedJobOrders = filterByIsoDate(jobOrderRows, {
    getDate: (row) => row.released_at,
    windowStartIso,
  });
  const periodInvoices = filterByIsoDate(invoiceRows, {
    getDate: (row) => row.created_at,
    windowStartIso,
  });
  const periodPayments = filterByIsoDate(paymentRows, {
    getDate: (row) => row.paid_at,
    windowStartIso,
  });
  const periodSales = filterByIsoDate(saleRows, {
    getDate: (row) => row.created_at,
    windowStartIso,
  });

  const unpaidInvoices = invoiceRows.filter(isUnpaidInvoice);
  const unpaidCustomerIds = [
    ...new Set(unpaidInvoices.flatMap((invoice) => (invoice.customer_id ? [invoice.customer_id] : []))),
  ];
  const stockMovementProductIds = [
    ...new Set(stockMovementRows.map((movement) => movement.product_id)),
  ];
  const [customerMap, productMap] = await Promise.all([
    getCustomerNameMap(unpaidCustomerIds),
    getProductNameMap(stockMovementProductIds),
  ]);

  return {
    window,
    performanceMetrics: [
      {
        label: "Quotation value",
        value: sumBy(periodQuotations, (row) => row.total_amount),
        kind: "currency",
      },
      {
        label: "Job orders opened",
        value: periodJobOrders.length,
        kind: "count",
      },
      {
        label: "Vehicles released",
        value: periodReleasedJobOrders.length,
        kind: "count",
      },
      {
        label: "Invoiced value",
        value: sumBy(periodInvoices, (row) => row.total_amount),
        kind: "currency",
      },
      {
        label: "Payments collected",
        value: sumBy(periodPayments, (row) => row.amount),
        kind: "currency",
      },
      {
        label: "POS sales value",
        value: sumBy(periodSales, (row) => row.total_amount),
        kind: "currency",
      },
    ],
    operationalMetrics: [
      {
        label: "Open job orders",
        value: jobOrderRows.filter(
          (row) => !["released", "cancelled"].includes(row.status),
        ).length,
        kind: "count",
      },
      {
        label: "Unpaid invoices",
        value: unpaidInvoices.length,
        kind: "count",
      },
      {
        label: "Low stock items",
        value: inventoryStockRows.filter(
          (row) =>
            row.reorder_level !== null &&
            row.available_quantity <= row.reorder_level,
        ).length,
        kind: "count",
      },
      {
        label: "Out of stock items",
        value: inventoryStockRows.filter((row) => row.available_quantity <= 0).length,
        kind: "count",
      },
      {
        label: "On-hand quantity",
        value: sumBy(inventoryStockRows, (row) => row.quantity_on_hand),
        kind: "quantity",
      },
    ],
    quotationStatusBreakdown: buildStatusBreakdown(
      periodQuotations.map((row) => row.status),
    ),
    jobOrderStatusBreakdown: buildStatusBreakdown(
      jobOrderRows.map((row) => row.status),
    ),
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
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .in("id", customerIds);

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
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as ProductRow[]).map((row) => [row.id, row.name]));
}

function sumBy<T>(rows: T[], selector: (row: T) => number) {
  return Number(rows.reduce((sum, row) => sum + selector(row), 0).toFixed(2));
}

function isUnpaidInvoice(
  invoice: InvoiceRow,
): invoice is InvoiceRow & { status: "unpaid" | "partially_paid" } {
  return invoice.status === "unpaid" || invoice.status === "partially_paid";
}
