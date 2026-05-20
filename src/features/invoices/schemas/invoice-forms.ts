import { z } from "zod";
import { isPositiveMoneyInput } from "@/lib/currency";
import { PAYMENT_METHOD_VALUES } from "@/features/invoices/types";

export const createInvoiceFromJobOrderSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required."),
  cancellationReason: z
    .string()
    .trim()
    .min(1, "Cancellation reason is required.")
    .max(500, "Cancellation reason is too long."),
});

export const recordInvoicePaymentSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required."),
  jobOrderId: z.string().optional(),
  amount: z
    .string()
    .trim()
    .refine(isPositiveMoneyInput, "Amount must be greater than zero with up to 4 decimal places."),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  referenceNumber: z.string().trim().max(100, "Reference number is too long."),
  notes: z.string().trim().max(500, "Notes are too long."),
});

export const releaseJobOrderVehicleSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
});

export function parseCreateInvoiceFromJobOrderFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
  };
}

export function parseRecordInvoicePaymentFormData(formData: FormData) {
  return {
    invoiceId: readString(formData, "invoiceId"),
    jobOrderId: readOptionalString(formData, "jobOrderId"),
    amount: readString(formData, "amount"),
    paymentMethod: readString(formData, "paymentMethod"),
    referenceNumber: readString(formData, "referenceNumber"),
    notes: readString(formData, "notes"),
  };
}

export function parseCancelInvoiceFormData(formData: FormData) {
  return {
    invoiceId: readString(formData, "invoiceId"),
    cancellationReason: readString(formData, "cancellationReason"),
  };
}

export function parseReleaseJobOrderVehicleFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value ? value : undefined;
}
