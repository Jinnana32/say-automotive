import { z } from "zod";

export const createInvoiceFromJobOrderSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
});

export const recordInvoicePaymentSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required."),
  jobOrderId: z.string().optional(),
  amount: z
    .string()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Amount must be greater than zero."),
  paymentMethod: z.enum(["cash", "gcash", "card", "bank_transfer", "check"]),
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
