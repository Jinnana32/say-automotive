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

export const JOB_ORDER_STATUS_WORKFLOW: JobOrderStatus[] = [
  "pending",
  "waiting_for_parts",
  "waiting_for_customer_approval",
  "in_progress",
  "completed",
  "released",
  "cancelled",
];

const JOB_ORDER_STATUS_LABELS: Record<JobOrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  waiting_for_parts: "Waiting for Parts",
  waiting_for_customer_approval: "Waiting for Customer Approval",
  completed: "Completed",
  ready_for_billing: "Ready for Billing",
  paid: "Paid",
  released: "Released",
  cancelled: "Cancelled",
};

const JOB_ORDER_STATUS_DESCRIPTIONS: Record<JobOrderStatus, string> = {
  pending: "Job created but work has not started.",
  in_progress: "Vehicle is currently being worked on.",
  waiting_for_parts: "Work is paused while waiting for parts availability.",
  waiting_for_customer_approval:
    "Work is paused while waiting for customer approval on additional items.",
  ready_for_billing:
    "Work is staged for billing or adviser review before the final handoff.",
  completed: "Work is finished and the vehicle is ready for release or billing follow-up.",
  paid: "The invoice is fully settled and ready for customer release.",
  released: "Vehicle has been released to the customer.",
  cancelled: "Job order has been cancelled and is no longer active.",
};

export function formatJobOrderStatus(status: JobOrderStatus) {
  return JOB_ORDER_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function getJobOrderStatusDescription(status: JobOrderStatus) {
  return JOB_ORDER_STATUS_DESCRIPTIONS[status];
}

export function toTitleCaseWords(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function resolveJobOrderDetailTab(value: string | undefined): JobOrderDetailTab {
  return JOB_ORDER_DETAIL_TABS.includes(value as JobOrderDetailTab)
    ? (value as JobOrderDetailTab)
    : "overview";
}

export function getAllowedJobOrderStatusTransitions(
  status: JobOrderStatus,
  options?: {
    invoiceId?: string | null;
    requireInvoiceBeforeJobCompletion?: boolean;
  },
): JobOrderStatus[] {
  switch (status) {
    case "pending":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return [
        "waiting_for_parts",
        "waiting_for_customer_approval",
        "completed",
        "cancelled",
      ];
    case "waiting_for_parts":
      return ["in_progress", "cancelled"];
    case "waiting_for_customer_approval":
      return ["in_progress", "cancelled"];
    case "completed":
      return [];
    case "ready_for_billing":
      return ["completed"];
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
  return ["completed", "ready_for_billing", "released"].includes(status) && invoiceId === null;
}

export function canReleaseJobOrderVehicle(params: {
  status: JobOrderStatus;
  invoiceId: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  releasedAt: string | null;
}) {
  const eligibleStatus =
    ["in_progress", "completed", "ready_for_billing", "paid"].includes(params.status) &&
    params.status !== "released" &&
    params.releasedAt === null;

  if (!eligibleStatus) {
    return false;
  }

  const hasActiveInvoice =
    params.invoiceId !== null && params.invoiceStatus !== null && params.invoiceStatus !== "cancelled";

  if (!hasActiveInvoice) {
    return !params.requireInvoiceBeforeVehicleRelease;
  }

  if (
    params.invoiceStatus !== "paid" &&
    (params.requireFullPaymentBeforeRelease || !params.allowReleaseWithBalance)
  ) {
    return false;
  }

  return true;
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
    canUpdateStatusRole: boolean;
    canManageBillingRole: boolean;
  },
) {
  return {
    ...detail,
    ...buildJobOrderDetailCapabilities({
      status: detail.status,
      invoiceId: detail.invoiceId,
      invoiceStatus: detail.invoiceStatus,
      allowReleaseWithBalance: detail.allowReleaseWithBalance,
      requireFullPaymentBeforeRelease: detail.requireFullPaymentBeforeRelease,
      requireInvoiceBeforeJobCompletion: detail.requireInvoiceBeforeJobCompletion,
      requireInvoiceBeforeVehicleRelease: detail.requireInvoiceBeforeVehicleRelease,
      releasedAt: detail.releasedAt,
      canUpdateChecklistRole: params.canUpdateChecklistRole,
      canUpdateStatusRole: params.canUpdateStatusRole,
      canManageBillingRole: params.canManageBillingRole,
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
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireInvoiceBeforeJobCompletion: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  releasedAt: string | null;
  canUpdateChecklistRole: boolean;
  canUpdateStatusRole: boolean;
  canManageBillingRole: boolean;
}) {
  return {
    canEditDetails: canEditJobOrderDetails(params.status),
    canEditItems: canEditJobOrderItems(params.status),
    canAssignMechanics: canAssignMechanics(params.status),
    canAddAdditionalItems: canAddAdditionalItems(params.status),
    canResolveAdditionalItems: canResolveAdditionalItems(params.status),
    canUpdateChecklist:
      params.canUpdateChecklistRole && canUpdateJobOrderChecklist(params.status),
    canUpdateStatus: params.canUpdateStatusRole,
    canGenerateInvoice:
      params.canManageBillingRole &&
      canGenerateJobOrderInvoice(params.status, params.invoiceId),
    canReleaseVehicle:
      params.canManageBillingRole &&
      canReleaseJobOrderVehicle({
        status: params.status,
        invoiceId: params.invoiceId,
        invoiceStatus: params.invoiceStatus,
        allowReleaseWithBalance: params.allowReleaseWithBalance,
        requireFullPaymentBeforeRelease: params.requireFullPaymentBeforeRelease,
        requireInvoiceBeforeVehicleRelease: params.requireInvoiceBeforeVehicleRelease,
        releasedAt: params.releasedAt,
      }),
    availableNextStatuses: params.canUpdateStatusRole
      ? getAllowedJobOrderStatusTransitions(params.status, {
          invoiceId: params.invoiceId,
          requireInvoiceBeforeJobCompletion:
            params.requireInvoiceBeforeJobCompletion,
        })
      : [],
  };
}
function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}
