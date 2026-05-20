import {
  JOB_ORDER_DETAIL_TABS,
  type JobOrderDetail,
  type JobOrderDetailTab,
  type JobOrderItemDetail,
  type JobOrderItemInventoryTracking,
  type JobOrderPartUsageEntry,
  type JobOrderStatus,
} from "@/features/job-orders/types";
import { roundCurrency } from "@/lib/currency";

const FINAL_MECHANIC_LOCKED_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
  "cancelled",
];

const FINAL_ITEM_LOCKED_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
  "cancelled",
];

const DETAIL_LOCKED_STATUSES: JobOrderStatus[] = ["released", "cancelled"];

export function formatJobOrderStatus(status: JobOrderStatus) {
  return status.replaceAll("_", " ");
}

export function toTitleCaseWords(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function resolveJobOrderDetailTab(value: string | undefined): JobOrderDetailTab {
  return JOB_ORDER_DETAIL_TABS.includes(value as JobOrderDetailTab)
    ? (value as JobOrderDetailTab)
    : "overview";
}

export function getAllowedJobOrderStatusTransitions(status: JobOrderStatus): JobOrderStatus[] {
  switch (status) {
    case "pending":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["waiting_for_parts", "waiting_for_customer_approval", "completed", "cancelled"];
    case "waiting_for_parts":
      return ["in_progress", "waiting_for_customer_approval", "cancelled"];
    case "waiting_for_customer_approval":
      return ["in_progress", "waiting_for_parts", "cancelled"];
    case "completed":
      return ["ready_for_billing"];
    default:
      return [];
  }
}

export function canEditJobOrderDetails(status: JobOrderStatus) {
  return !DETAIL_LOCKED_STATUSES.includes(status);
}

export function canAssignMechanics(status: JobOrderStatus) {
  return !FINAL_MECHANIC_LOCKED_STATUSES.includes(status);
}

export function canAddAdditionalItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function canEditJobOrderItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function canUpdateJobOrderChecklist(status: JobOrderStatus) {
  return !["released", "cancelled"].includes(status);
}

export function canResolveAdditionalItems(status: JobOrderStatus) {
  return !FINAL_ITEM_LOCKED_STATUSES.includes(status);
}

export function canGenerateJobOrderInvoice(status: JobOrderStatus, invoiceId: string | null) {
  return status === "ready_for_billing" && invoiceId === null;
}

export function canReleaseJobOrderVehicle(params: {
  status: JobOrderStatus;
  invoiceId: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  releasedAt: string | null;
}) {
  return (
    params.invoiceId !== null &&
    params.invoiceStatus !== "cancelled" &&
    params.status !== "released" &&
    params.releasedAt === null
  );
}

export function calculateJobOrderBillableTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.approvalStatus === "not_required" || item.approvalStatus === "approved")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function calculateJobOrderPendingApprovalCount(items: JobOrderItemDetail[]) {
  return items.filter((item) => item.isAdditional && item.approvalStatus === "pending").length;
}

export function calculateJobOrderPendingApprovalTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.isAdditional && item.approvalStatus === "pending")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function calculateJobOrderRejectedAdditionalTotal(items: JobOrderItemDetail[]) {
  return roundCurrency(
    items
      .filter((item) => item.isAdditional && item.approvalStatus === "rejected")
      .reduce((sum, item) => sum + item.total, 0),
  );
}

export function mapJobOrderDetailCapabilities(
  detail: Omit<JobOrderDetail, keyof ReturnType<typeof buildJobOrderDetailCapabilities>>,
  params: {
    canUpdateChecklistRole: boolean;
  },
) {
  return {
    ...detail,
    ...buildJobOrderDetailCapabilities({
      status: detail.status,
      invoiceId: detail.invoiceId,
      invoiceStatus: detail.invoiceStatus,
      releasedAt: detail.releasedAt,
      canUpdateChecklistRole: params.canUpdateChecklistRole,
    }),
  };
}

export function toNumeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildJobOrderItemInventoryTracking(params: {
  plannedQuantity: number;
  hasStockRecord: boolean;
  quantityOnHand: number | null;
  availableQuantity: number | null;
  reorderLevel: number | null;
  shelfLocation: string | null;
  usageHistory: JobOrderPartUsageEntry[];
}): JobOrderItemInventoryTracking {
  const usedQuantity = roundQuantity(
    params.usageHistory
      .filter((entry) => entry.usageType === "use")
      .reduce((sum, entry) => sum + entry.quantity, 0),
  );
  const returnedQuantity = roundQuantity(
    params.usageHistory
      .filter((entry) => entry.usageType === "return")
      .reduce((sum, entry) => sum + entry.quantity, 0),
  );
  const netUsedQuantity = roundQuantity(usedQuantity - returnedQuantity);
  const remainingUsageQuantity = roundQuantity(Math.max(params.plannedQuantity - netUsedQuantity, 0));

  return {
    hasStockRecord: params.hasStockRecord,
    quantityOnHand: params.quantityOnHand,
    availableQuantity: params.availableQuantity,
    reorderLevel: params.reorderLevel,
    shelfLocation: params.shelfLocation,
    isLowStock:
      params.availableQuantity !== null &&
      params.reorderLevel !== null &&
      params.availableQuantity <= params.reorderLevel,
    usedQuantity,
    returnedQuantity,
    netUsedQuantity,
    remainingUsageQuantity,
    usageHistory: params.usageHistory,
  };
}

export function isJobOrderChecklistRequired(item: JobOrderItemDetail) {
  return item.approvalStatus === "approved" || item.approvalStatus === "not_required";
}

export function getJobOrderChecklistStatus(item: JobOrderItemDetail) {
  if (item.approvalStatus === "pending") {
    return {
      label: "Pending approval",
      variant: "warning" as const,
      actionable: false,
    };
  }

  if (item.approvalStatus === "rejected") {
    return {
      label: "Rejected",
      variant: "destructive" as const,
      actionable: false,
    };
  }

  if (item.checklistCompleted) {
    return {
      label: "Completed",
      variant: "success" as const,
      actionable: true,
    };
  }

  return {
    label: "Open",
    variant: "neutral" as const,
    actionable: true,
  };
}

export function calculateJobOrderChecklistSummary(items: JobOrderItemDetail[]) {
  const requiredItems = items.filter(isJobOrderChecklistRequired);
  const completedRequiredItems = requiredItems.filter((item) => item.checklistCompleted);

  return {
    requiredCount: requiredItems.length,
    completedCount: completedRequiredItems.length,
    blockedCount: items.length - requiredItems.length,
    allRequiredCompleted:
      requiredItems.length > 0 && completedRequiredItems.length === requiredItems.length,
  };
}

export function groupJobOrderChecklistItems(items: JobOrderItemDetail[]) {
  return [
    {
      key: "service-labor",
      label: "Services / Labor",
      items: items.filter(
        (item) => item.itemType === "service" || item.itemType === "labor",
      ),
    },
    {
      key: "parts-products",
      label: "Parts / Products",
      items: items.filter((item) => item.itemType === "product"),
    },
  ] as const;
}

function buildJobOrderDetailCapabilities(params: {
  status: JobOrderStatus;
  invoiceId: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  releasedAt: string | null;
  canUpdateChecklistRole: boolean;
}) {
  return {
    canEditDetails: canEditJobOrderDetails(params.status),
    canEditItems: canEditJobOrderItems(params.status),
    canAssignMechanics: canAssignMechanics(params.status),
    canAddAdditionalItems: canAddAdditionalItems(params.status),
    canResolveAdditionalItems: canResolveAdditionalItems(params.status),
    canUpdateChecklist:
      params.canUpdateChecklistRole && canUpdateJobOrderChecklist(params.status),
    canGenerateInvoice: canGenerateJobOrderInvoice(params.status, params.invoiceId),
    canReleaseVehicle: canReleaseJobOrderVehicle({
      status: params.status,
      invoiceId: params.invoiceId,
      invoiceStatus: params.invoiceStatus,
      releasedAt: params.releasedAt,
    }),
    availableNextStatuses: getAllowedJobOrderStatusTransitions(params.status),
  };
}
function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}
