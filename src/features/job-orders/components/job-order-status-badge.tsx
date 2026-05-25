import { StatusBadge } from "@/components/shared/status-badge";
import type { JobOrderApprovalStatus, JobOrderStatus, JobOrderUsageStatus } from "@/features/job-orders/types";
import {
  formatJobOrderStatus,
  getSimplifiedJobOrderStatus,
} from "@/features/job-orders/utils";

export function JobOrderStatusBadge({ status }: { status: JobOrderStatus }) {
  const simplifiedStatus = getSimplifiedJobOrderStatus(status);
  const variant =
    simplifiedStatus === "released"
      ? "success"
      : simplifiedStatus === "cancelled"
        ? "destructive"
        : simplifiedStatus === "in_progress" || simplifiedStatus === "completed"
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
