import { StatusBadge } from "@/components/shared/status-badge";
import type { InvoiceStatus, PaymentMethod } from "@/features/invoices/types";
import { formatInvoiceStatus, formatPaymentMethod } from "@/features/invoices/utils";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant =
    status === "paid"
      ? "success"
      : status === "partially_paid"
        ? "warning"
        : status === "cancelled"
          ? "destructive"
          : "neutral";

  return <StatusBadge tone={variant}>{formatInvoiceStatus(status)}</StatusBadge>;
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const variant = method === "cash" ? "info" : "neutral";
  return <StatusBadge tone={variant}>{formatPaymentMethod(method)}</StatusBadge>;
}
