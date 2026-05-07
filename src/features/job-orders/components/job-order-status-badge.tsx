import { StatusBadge } from "@/components/shared/status-badge";
import type { JobOrderApprovalStatus, JobOrderStatus, JobOrderUsageStatus } from "@/features/job-orders/types";
import { formatJobOrderStatus } from "@/features/job-orders/utils";

export function JobOrderStatusBadge({ status }: { status: JobOrderStatus }) {
  const variant =
    status === "released" || status === "paid"
      ? "success"
      : status === "cancelled"
        ? "destructive"
        : status === "waiting_for_parts" || status === "waiting_for_customer_approval"
          ? "warning"
          : status === "in_progress" || status === "completed" || status === "ready_for_billing"
            ? "info"
            : "neutral";

  return <StatusBadge tone={variant}>{formatJobOrderStatus(status)}</StatusBadge>;
}

export function JobOrderApprovalBadge({ status }: { status: JobOrderApprovalStatus }) {
  const variant =
    status === "approved"
      ? "success"
      : status === "pending"
        ? "warning"
        : status === "rejected"
          ? "destructive"
          : "neutral";

  return <StatusBadge tone={variant}>{status.replaceAll("_", " ")}</StatusBadge>;
}

export function JobOrderUsageBadge({ status }: { status: JobOrderUsageStatus }) {
  const variant =
    status === "used"
      ? "success"
      : status === "returned"
        ? "info"
        : status === "cancelled"
          ? "destructive"
          : "neutral";

  return <StatusBadge tone={variant}>{status.replaceAll("_", " ")}</StatusBadge>;
}
