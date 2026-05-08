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
  const snapshotVehicleLabel = buildQuotationVehicleLabel({
    make: row.vehicle_make_snapshot,
    model: row.vehicle_model_snapshot,
    year: row.vehicle_year_snapshot,
    plateNumber: row.vehicle_plate_number_snapshot,
  });

  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    branchId: row.branch_id,
    customerId: row.customer_id,
    customerName: row.customer_name_snapshot ?? customerName,
    vehicleId: row.vehicle_id,
    vehicleLabel: snapshotVehicleLabel ?? vehicleLabel,
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
    unitLabel: row.unit_label_snapshot,
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
    customerContactNumber: row.customer_contact_snapshot,
    customerAddress: row.customer_address_snapshot,
    vehicleMake: row.vehicle_make_snapshot,
    vehicleModel: row.vehicle_model_snapshot,
    vehicleYear: row.vehicle_year_snapshot,
    vehiclePlateNumber: row.vehicle_plate_number_snapshot,
    vehicleVin: row.vehicle_vin_snapshot,
    natureOfRepair: row.nature_of_repair,
    inspectionNotes: row.inspection_notes,
    preparedByName: row.prepared_by_name_snapshot,
    preparedByTitle: row.prepared_by_title_snapshot,
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
    natureOfRepair: detail.natureOfRepair ?? "",
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

function buildQuotationVehicleLabel(params: {
  make: string | null;
  model: string | null;
  year: number | null;
  plateNumber: string | null;
}) {
  if (!params.make || !params.model) {
    return null;
  }

  const yearPart = params.year ? ` (${params.year})` : "";
  const platePart = params.plateNumber ? ` · ${params.plateNumber}` : "";
  return `${params.make} ${params.model}${yearPart}${platePart}`;
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
