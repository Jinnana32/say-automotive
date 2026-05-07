import type { InvoiceDetail, InvoiceStatus, PaymentMethod } from "@/features/invoices/types";

export function formatInvoiceStatus(status: InvoiceStatus) {
  return status.replaceAll("_", " ");
}

export function formatPaymentMethod(method: PaymentMethod) {
  return method.replaceAll("_", " ");
}

export function canRecordInvoicePayment(detail: Pick<InvoiceDetail, "status" | "balance">) {
  return detail.status !== "cancelled" && detail.balance > 0;
}

export function canReleaseInvoiceVehicle(detail: Pick<InvoiceDetail, "jobOrderId" | "status" | "releasedAt">) {
  return detail.jobOrderId !== null && detail.status !== "cancelled" && detail.releasedAt === null;
}

export function toNumeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
