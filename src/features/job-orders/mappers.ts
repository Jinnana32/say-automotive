import type { TableRow } from "@/types/database";

import type {
  JobOrderDetail,
  JobOrderItemDetail,
  JobOrderItemInventoryTracking,
  JobOrderListItem,
  JobOrderMechanicAssignment,
  JobOrderMechanicOption,
  JobOrderPartUsageEntry,
  JobOrderProductOption,
  JobOrderServiceOption,
} from "@/features/job-orders/types";
import {
  buildJobOrderItemInventoryTracking,
  calculateJobOrderBillableTotal,
  calculateJobOrderPendingApprovalCount,
  calculateJobOrderPendingApprovalTotal,
  calculateJobOrderRejectedAdditionalTotal,
  canDeleteJobOrder,
  mapJobOrderDetailCapabilities,
} from "@/features/job-orders/utils";

type JobOrderRow = TableRow<"job_orders">;
type JobOrderItemRow = TableRow<"job_order_items">;
type JobOrderMechanicRow = TableRow<"job_order_mechanics">;
type StaffRow = TableRow<"staff">;
type ProductRow = TableRow<"products">;
type ServiceRow = TableRow<"services">;

export function mapJobOrderPartUsageToEntry(params: {
  usageRow: TableRow<"job_order_part_usages">;
  movementRow: Pick<TableRow<"stock_movements">, "previous_quantity" | "new_quantity"> | null;
}): JobOrderPartUsageEntry {
  return {
    id: params.usageRow.id,
    usageType: params.usageRow.usage_type,
    quantity: params.usageRow.quantity,
    notes: params.usageRow.notes,
    createdAt: params.usageRow.created_at,
    previousQuantity: params.movementRow?.previous_quantity ?? 0,
    newQuantity: params.movementRow?.new_quantity ?? 0,
  };
}

export function mapJobOrderItemRowToDetail(params: {
  row: JobOrderItemRow;
  inventoryTracking?: JobOrderItemInventoryTracking | null;
  checklistCheckedByName?: string | null;
}): JobOrderItemDetail {
  const {
    row,
    inventoryTracking = null,
    checklistCheckedByName = null,
  } = params;

  return {
    id: row.id,
    sourceQuotationItemId: row.source_quotation_item_id,
    lineNumber: row.line_number,
    itemType: row.item_type,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
    isAdditional: row.is_additional,
    approvalStatus: row.approval_status,
    usageStatus: row.usage_status,
    checklistCompleted: row.checklist_completed,
    checklistCheckedAt: row.checklist_checked_at,
    checklistCheckedByStaffId: row.checklist_checked_by_staff_id,
    checklistCheckedByName,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    inventoryTracking,
  };
}

export function buildInventoryTracking(params: {
  itemRow: JobOrderItemRow;
  stockRow: Pick<TableRow<"inventory_stocks">, "quantity_on_hand" | "available_quantity" | "reorder_level" | "shelf_location"> | null;
  productRow: Pick<TableRow<"products">, "reorder_level" | "shelf_location"> | null;
  usageHistory: JobOrderPartUsageEntry[];
}) {
  if (params.itemRow.item_type !== "product") {
    return null;
  }

  return buildJobOrderItemInventoryTracking({
    plannedQuantity: params.itemRow.quantity,
    hasStockRecord: params.stockRow !== null,
    quantityOnHand: params.stockRow?.quantity_on_hand ?? null,
    availableQuantity: params.stockRow?.available_quantity ?? null,
    reorderLevel: params.stockRow?.reorder_level ?? params.productRow?.reorder_level ?? null,
    shelfLocation: params.stockRow?.shelf_location ?? params.productRow?.shelf_location ?? null,
    usageHistory: params.usageHistory,
  });
}

export function mapJobOrderMechanicRowToAssignment(
  row: JobOrderMechanicRow,
  fullName: string,
): JobOrderMechanicAssignment {
  return {
    id: row.id,
    staffId: row.staff_id,
    fullName,
    taskDescription: row.task_description,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function mapJobOrderRowToListItem(params: {
  row: JobOrderRow;
  customerName: string;
  vehicleLabel: string;
  quotationNumber: string | null;
  assignedMechanicCount: number;
  items: JobOrderItemDetail[];
  hasInvoice: boolean;
}): JobOrderListItem {
  return {
    id: params.row.id,
    jobOrderNumber: params.row.job_order_number,
    quotationId: params.row.quotation_id,
    quotationNumber: params.quotationNumber,
    customerId: params.row.customer_id,
    customerName: params.customerName,
    vehicleId: params.row.vehicle_id,
    vehicleLabel: params.vehicleLabel,
    status: params.row.status,
    createdAt: params.row.created_at,
    startedAt: params.row.started_at,
    completedAt: params.row.completed_at,
    releasedAt: params.row.released_at,
    isHistorical: params.row.is_historical,
    serviceDate: params.row.service_date,
    historicalRecordedAt: params.row.historical_recorded_at,
    assignedMechanicCount: params.assignedMechanicCount,
    billableTotal: calculateJobOrderBillableTotal(params.items),
    pendingApprovalCount: calculateJobOrderPendingApprovalCount(params.items),
    pendingApprovalTotal: calculateJobOrderPendingApprovalTotal(params.items),
    canDelete: canDeleteJobOrder({
      isHistorical: params.row.is_historical,
      status: params.row.status,
      hasInvoice: params.hasInvoice,
      items: params.items,
    }),
  };
}

export function mapJobOrderDetail(params: {
  row: JobOrderRow;
  customerName: string;
  vehicleLabel: string;
  quotationNumber: string | null;
  invoice: {
    id: string;
    invoice_number: string;
    status: "unpaid" | "partially_paid" | "paid" | "cancelled";
    total_amount: number;
    paid_amount: number;
    balance: number;
  } | null;
  settings: {
    allow_release_with_balance: boolean;
    require_full_payment_before_release: boolean;
    require_invoice_before_job_completion: boolean;
    require_invoice_before_vehicle_release: boolean;
  } | null;
  items: JobOrderItemDetail[];
  mechanics: JobOrderMechanicAssignment[];
  canUpdateChecklistRole: boolean;
  canUpdateStatusRole: boolean;
  canManageBillingRole: boolean;
}): JobOrderDetail {
  const listItem = mapJobOrderRowToListItem({
    row: params.row,
    customerName: params.customerName,
    vehicleLabel: params.vehicleLabel,
    quotationNumber: params.quotationNumber,
    assignedMechanicCount: params.mechanics.length,
    items: params.items,
    hasInvoice: params.invoice !== null && params.invoice.status !== "cancelled",
  });

  return mapJobOrderDetailCapabilities(
    {
      ...listItem,
      mileageIn: params.row.mileage_in,
      mileageOut: params.row.mileage_out,
      customerConcern: params.row.customer_concern,
      inspectionNotes: params.row.inspection_notes,
      diagnosis: params.row.diagnosis,
      workPerformed: params.row.work_performed,
      isHistorical: params.row.is_historical,
      serviceDate: params.row.service_date,
      historicalRecordedAt: params.row.historical_recorded_at,
      allowReleaseWithBalance:
        params.settings?.allow_release_with_balance ?? false,
      requireFullPaymentBeforeRelease:
        params.settings?.require_full_payment_before_release ?? true,
      requireInvoiceBeforeJobCompletion:
        params.settings?.require_invoice_before_job_completion ?? false,
      requireInvoiceBeforeVehicleRelease:
        params.settings?.require_invoice_before_vehicle_release ?? false,
      invoiceId: params.invoice?.id ?? null,
      invoiceNumber: params.invoice?.invoice_number ?? null,
      invoiceStatus: params.invoice?.status ?? null,
      invoiceTotalAmount: params.invoice?.total_amount ?? null,
      invoicePaidAmount: params.invoice?.paid_amount ?? null,
      invoiceBalance: params.invoice?.balance ?? null,
      items: params.items,
      mechanics: params.mechanics,
      rejectedAdditionalTotal: calculateJobOrderRejectedAdditionalTotal(params.items),
    },
    {
      canUpdateChecklistRole: params.canUpdateChecklistRole,
      canUpdateStatusRole: params.canUpdateStatusRole,
      canManageBillingRole: params.canManageBillingRole,
    },
  );
}

export function mapStaffRowToMechanicOption(row: Pick<StaffRow, "id" | "first_name" | "last_name">): JobOrderMechanicOption {
  return {
    id: row.id,
    label: `${row.first_name} ${row.last_name}`.trim(),
  };
}

export function mapProductRowToJobOrderOption(
  row: Pick<ProductRow, "id" | "name" | "sku" | "selling_price">,
): JobOrderProductOption {
  return {
    id: row.id,
    label: row.name,
    sku: row.sku,
    unitPrice: row.selling_price,
  };
}

export function mapServiceRowToJobOrderOption(
  row: Pick<ServiceRow, "id" | "name" | "category" | "labor_price">,
): JobOrderServiceOption {
  return {
    id: row.id,
    label: row.name,
    category: row.category,
    unitPrice: row.labor_price,
  };
}
