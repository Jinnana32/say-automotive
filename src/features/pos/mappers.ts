import type { TableRow } from "@/types/database";

import type {
  PosCustomerOption,
  PosProductOption,
  PosRecentSaleItem,
} from "@/features/pos/types";

type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type ProductRow = Pick<
  TableRow<"products">,
  "id" | "name" | "sku" | "barcode" | "unit_id" | "selling_price" | "reorder_level" | "shelf_location"
>;
type UnitRow = Pick<TableRow<"units">, "id" | "name" | "abbreviation">;
type StockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "available_quantity" | "reorder_level" | "shelf_location"
>;
type SaleRow = Pick<TableRow<"sales">, "id" | "sale_number" | "customer_id" | "total_amount" | "created_at">;
type InvoiceRow = Pick<TableRow<"invoices">, "id" | "invoice_number" | "status">;
type PaymentRow = Pick<TableRow<"payments">, "payment_method">;

export function mapCustomerRowToPosOption(row: CustomerRow): PosCustomerOption {
  return {
    id: row.id,
    label: row.display_name,
  };
}

export function mapProductRowToPosOption(
  row: ProductRow,
  params: {
    unitLabel: string;
    stock: StockRow | null;
  },
): PosProductOption {
  const availableQuantity = params.stock?.available_quantity ?? 0;
  const reorderLevel = params.stock?.reorder_level ?? row.reorder_level ?? null;
  const shelfLocation = params.stock?.shelf_location ?? row.shelf_location ?? null;

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    unitLabel: params.unitLabel,
    sellingPrice: row.selling_price,
    availableQuantity,
    reorderLevel,
    shelfLocation,
    isLowStock: reorderLevel !== null && availableQuantity <= reorderLevel,
  };
}

export function mapRecentSaleRowToListItem(params: {
  sale: SaleRow;
  customerName: string;
  invoice: InvoiceRow | null;
  payment: PaymentRow | null;
}): PosRecentSaleItem {
  return {
    id: params.sale.id,
    saleNumber: params.sale.sale_number,
    customerName: params.customerName,
    totalAmount: params.sale.total_amount,
    invoiceId: params.invoice?.id ?? null,
    invoiceNumber: params.invoice?.invoice_number ?? null,
    invoiceStatus: params.invoice?.status ?? null,
    paymentMethod: params.payment?.payment_method ?? null,
    createdAt: params.sale.created_at,
  };
}

export function buildUnitLabelMap(rows: UnitRow[]) {
  return new Map(rows.map((row) => [row.id, `${row.name} (${row.abbreviation})`]));
}

export function buildStockMap(rows: StockRow[]) {
  return new Map(rows.map((row) => [row.product_id, row]));
}
