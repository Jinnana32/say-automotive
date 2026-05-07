import type { TableRow } from "@/types/database";

import type {
  QuotationDetail,
  QuotationFormItem,
  QuotationFormValues,
  QuotationItemDetail,
  QuotationListItem,
  QuotationProductOption,
  QuotationServiceOption,
  QuotationVehicleOption,
} from "@/features/quotations/types";
import { createQuotationItem } from "@/features/quotations/utils";

type QuotationRow = TableRow<"quotations">;
type QuotationItemRow = TableRow<"quotation_items">;
type ProductRow = TableRow<"products">;
type ServiceRow = TableRow<"services">;
type VehicleRow = TableRow<"vehicles">;

export function mapQuotationRowToListItem(
  row: QuotationRow,
  customerName: string,
  vehicleLabel: string,
): QuotationListItem {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    customerId: row.customer_id,
    customerName,
    vehicleId: row.vehicle_id,
    vehicleLabel,
    status: row.status,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

export function mapQuotationItemRowToDetail(row: QuotationItemRow): QuotationItemDetail {
  return {
    id: row.id,
    lineNumber: row.line_number,
    itemType: row.item_type,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
  };
}

export function mapQuotationDetail(
  row: QuotationRow,
  customerName: string,
  vehicleLabel: string,
  items: QuotationItemRow[],
  jobOrder: Pick<TableRow<"job_orders">, "id" | "job_order_number"> | null,
): QuotationDetail {
  return {
    ...mapQuotationRowToListItem(row, customerName, vehicleLabel),
    inspectionNotes: row.inspection_notes,
    items: items.map(mapQuotationItemRowToDetail),
    jobOrderId: jobOrder?.id ?? null,
    jobOrderNumber: jobOrder?.job_order_number ?? null,
  };
}

export function mapQuotationDetailToFormValues(detail: QuotationDetail): QuotationFormValues {
  return {
    quotationId: detail.id,
    customerId: detail.customerId,
    vehicleId: detail.vehicleId,
    inspectionNotes: detail.inspectionNotes ?? "",
    status: detail.status === "draft" ? "draft" : "pending_approval",
    discount: String(detail.discount),
    tax: String(detail.tax),
    items: detail.items.map((item) =>
      createQuotationItem({
        key: item.id,
        itemType: item.itemType,
        productId: item.productId ?? "",
        serviceId: item.serviceId ?? "",
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      }),
    ),
  };
}

export function mapVehicleRowToQuotationOption(row: VehicleRow): QuotationVehicleOption {
  const platePart = row.plate_number ? ` · ${row.plate_number}` : "";
  const yearPart = row.year ? ` (${row.year})` : "";

  return {
    id: row.id,
    customerId: row.customer_id,
    label: `${row.make} ${row.model}${yearPart}${platePart}`,
  };
}

export function mapProductRowToQuotationOption(row: ProductRow): QuotationProductOption {
  return {
    id: row.id,
    label: row.name,
    sku: row.sku,
    unitPrice: row.selling_price,
  };
}

export function mapServiceRowToQuotationOption(row: ServiceRow): QuotationServiceOption {
  return {
    id: row.id,
    label: row.name,
    category: row.category,
    unitPrice: row.labor_price,
  };
}
