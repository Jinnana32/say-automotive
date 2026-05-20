import {
  PAYMENT_METHOD_OPTIONS,
  type InvoiceDetail,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/features/invoices/types";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PaymentMethod, string>;

export function formatInvoiceStatus(status: InvoiceStatus) {
  return status.replaceAll("_", " ");
}

export function formatPaymentMethod(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method];
}

export function canRecordInvoicePayment(detail: Pick<InvoiceDetail, "status" | "balance">) {
  return detail.status !== "cancelled" && detail.balance > 0;
}

export function canReleaseInvoiceVehicle(detail: Pick<InvoiceDetail, "jobOrderId" | "status" | "releasedAt">) {
  return detail.jobOrderId !== null && detail.status !== "cancelled" && detail.releasedAt === null;
}

export function canCancelInvoice(
  detail: Pick<InvoiceDetail, "status" | "paidAmount" | "saleId" | "releasedAt">,
) {
  return (
    detail.status !== "cancelled" &&
    detail.paidAmount === 0 &&
    detail.saleId === null &&
    detail.releasedAt === null
  );
}

export function toNumeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
