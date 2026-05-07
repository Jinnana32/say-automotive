import { StatusBadge } from "@/components/shared/status-badge";
import type { QuotationStatus } from "@/features/quotations/types";

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const variant =
    status === "approved"
      ? "success"
      : status === "pending_approval"
        ? "warning"
        : status === "rejected"
          ? "destructive"
          : "neutral";

  return <StatusBadge tone={variant}>{formatQuotationStatus(status)}</StatusBadge>;
}

export function formatQuotationStatus(status: QuotationStatus) {
  return status.replaceAll("_", " ");
}
