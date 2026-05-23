import { cache } from "react";

import type { TableRow } from "@/types/database";

import {
  buildStockMap,
  buildUnitLabelMap,
  mapCustomerRowToPosOption,
  mapProductRowToPosOption,
  mapRecentSaleRowToListItem,
} from "@/features/pos/mappers";
import type { PosRecentSaleItem, PosTerminalData } from "@/features/pos/types";
import {
  applyBranchFilter,
  getBranchScopedServerClient,
} from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type BusinessSettingsRow = Pick<
  TableRow<"business_settings">,
  | "business_name"
  | "default_tax_rate"
  | "allow_partial_payments"
  | "enable_barcode_support"
  | "receipt_footer"
>;
type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type ProductRow = Pick<
  TableRow<"products">,
  | "id"
  | "name"
  | "sku"
  | "barcode"
  | "unit_id"
  | "selling_price"
  | "reorder_level"
  | "shelf_location"
  | "product_image_path"
  | "product_image_url"
  | "website_image_url"
  | "updated_at"
>;
type UnitRow = Pick<TableRow<"units">, "id" | "name" | "abbreviation">;
type StockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "reorder_level" | "shelf_location"
>;
type SaleRow = Pick<TableRow<"sales">, "id" | "sale_number" | "customer_id" | "total_amount" | "created_at">;
type InvoiceRow = Pick<TableRow<"invoices">, "id" | "sale_id" | "invoice_number" | "status">;
type PaymentRow = Pick<TableRow<"payments">, "invoice_id" | "payment_method">;

export const getPosTerminalData = cache(async (): Promise<PosTerminalData> => {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("pos:read");
  const branch = branchScope.selectedBranch ?? branchScope.accessibleBranches[0] ?? null;

  if (!branch) {
    throw new Error("No accessible branch is configured for POS.");
  }

  const sharingSettings = await getCatalogSharingSettings(supabase, branch.id);

  const [
    { data: settings, error: settingsError },
    { data: customers, error: customersError },
    { data: products, error: productsError },
    { data: units, error: unitsError },
    { data: stocks, error: stocksError },
  ] = await Promise.all([
    supabase
      .from("business_settings")
      .select(
        "business_name, default_tax_rate, allow_partial_payments, enable_barcode_support, receipt_footer",
      )
      .eq("branch_id", branch.id)
      .maybeSingle(),
    applyBranchFilter(
      supabase
        .from("customers")
        .select("id, display_name")
        .eq("status", "active")
        .order("display_name", { ascending: true }),
      branch.id,
    ),
    applyCatalogVisibilityFilter(
      supabase
        .from("products")
        .select(
          "id, name, sku, barcode, unit_id, selling_price, reorder_level, shelf_location, product_image_path, product_image_url, website_image_url, updated_at",
        )
        .eq("status", "active")
        .order("name", { ascending: true }),
      {
        branchId: branch.id,
        includeGlobal: sharingSettings.allowGlobalProductCatalog,
      },
    ),
    supabase.from("units").select("id, name, abbreviation").order("name", { ascending: true }),
    supabase
      .from("inventory_stocks")
      .select("product_id, available_quantity, reorder_level, shelf_location")
      .eq("branch_id", branch.id),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (customersError) {
    throw new Error(customersError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (unitsError) {
    throw new Error(unitsError.message);
  }

  if (stocksError) {
    throw new Error(stocksError.message);
  }

  const unitLabelMap = buildUnitLabelMap((units ?? []) as UnitRow[]);
  const stockMap = buildStockMap((stocks ?? []) as StockRow[]);

  return {
    config: {
      branchId: branch.id,
      branchCode: branch.code,
      branchName: branch.name,
      businessName: ((settings as BusinessSettingsRow | null)?.business_name ?? branch.name),
      defaultTaxRate: ((settings as BusinessSettingsRow | null)?.default_tax_rate ?? 0),
      allowPartialPayments:
        ((settings as BusinessSettingsRow | null)?.allow_partial_payments ?? false),
      enableBarcodeSupport:
        ((settings as BusinessSettingsRow | null)?.enable_barcode_support ?? false),
      receiptFooter: ((settings as BusinessSettingsRow | null)?.receipt_footer ?? null),
    },
    customers: ((customers ?? []) as CustomerRow[]).map(mapCustomerRowToPosOption),
    products: ((products ?? []) as ProductRow[]).map((row) =>
      mapProductRowToPosOption(row, {
        unitLabel: unitLabelMap.get(row.unit_id) ?? "Unknown unit",
        stock: stockMap.get(row.id) ?? null,
      }),
    ),
    permissions: {
      canCreateProducts: context.capabilities.includes("products:write"),
    },
  };
});

export async function listRecentPosSales(limit = 10): Promise<PosRecentSaleItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("pos:read");
  const { data: sales, error: salesError } = await applyBranchFilter(
    supabase
      .from("sales")
      .select("id, sale_number, customer_id, total_amount, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit),
    branchScope.selectedBranchId,
  );

  if (salesError) {
    throw new Error(salesError.message);
  }

  const saleRows = (sales ?? []) as SaleRow[];
  const saleIds = saleRows.map((sale) => sale.id);
  const customerIds = [...new Set(saleRows.flatMap((sale) => (sale.customer_id ? [sale.customer_id] : [])))];

  const [{ data: invoices, error: invoicesError }, customerMap, paymentMap] = await Promise.all([
    saleIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : applyBranchFilter(
          supabase
            .from("invoices")
            .select("id, sale_id, invoice_number, status")
            .in("sale_id", saleIds),
          branchScope.selectedBranchId,
        ),
    getCustomerNameMap(customerIds, branchScope.selectedBranchId),
    getPaymentMethodMap(saleIds, branchScope.selectedBranchId),
  ]);

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  const invoiceMap = new Map(
    ((invoices ?? []) as InvoiceRow[])
      .filter((invoice) => invoice.sale_id !== null)
      .map((invoice) => [invoice.sale_id as string, invoice]),
  );

  return saleRows.map((sale) =>
    mapRecentSaleRowToListItem({
      sale,
      customerName: sale.customer_id
        ? customerMap.get(sale.customer_id) ?? "Unknown customer"
        : "Walk-in customer",
      invoice: invoiceMap.get(sale.id) ?? null,
      payment: paymentMap.get(sale.id) ?? null,
    }),
  );
}

async function getCustomerNameMap(customerIds: string[], branchId: string | null) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await applyBranchFilter(
    supabase.from("customers").select("id, display_name").in("id", customerIds),
    branchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as CustomerRow[]).map((row) => [row.id, row.display_name]));
}

async function getPaymentMethodMap(saleIds: string[], branchId: string | null) {
  if (saleIds.length === 0) {
    return new Map<string, PaymentRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data: invoices, error: invoiceError } = await applyBranchFilter(
    supabase.from("invoices").select("id, sale_id").in("sale_id", saleIds),
    branchId,
  );

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const invoiceRows = (invoices ?? []) as Pick<TableRow<"invoices">, "id" | "sale_id">[];
  const invoiceIds = invoiceRows.map((invoice) => invoice.id);

  if (invoiceIds.length === 0) {
    return new Map<string, PaymentRow>();
  }

  const { data: payments, error: paymentError } = await applyBranchFilter(
    supabase
      .from("payments")
      .select("invoice_id, payment_method")
      .in("invoice_id", invoiceIds)
      .order("paid_at", { ascending: false }),
    branchId,
  );

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const paymentRows = (payments ?? []) as PaymentRow[];
  const paymentByInvoiceId = new Map<string, PaymentRow>();

  for (const row of paymentRows) {
    if (!paymentByInvoiceId.has(row.invoice_id)) {
      paymentByInvoiceId.set(row.invoice_id, row);
    }
  }

  const paymentBySaleId = new Map<string, PaymentRow>();

  for (const invoice of invoiceRows) {
    if (invoice.sale_id && paymentByInvoiceId.has(invoice.id)) {
      paymentBySaleId.set(invoice.sale_id, paymentByInvoiceId.get(invoice.id)!);
    }
  }

  return paymentBySaleId;
}
