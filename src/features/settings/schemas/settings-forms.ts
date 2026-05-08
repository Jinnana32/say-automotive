import { z } from "zod";

import type { SettingsDocumentSequenceKey } from "@/features/settings/types";

export const businessProfileSettingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required."),
  businessAddress: z.string().trim().max(500, "Business address is too long."),
  businessContact: z.string().trim().max(200, "Business contact is too long."),
  businessEmail: z
    .string()
    .trim()
    .max(200, "Business email is too long.")
    .refine((value) => !value || z.email().safeParse(value).success, "Enter a valid business email."),
  receiptFooter: z.string().trim().max(500, "Receipt footer is too long."),
  defaultTaxRate: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100,
      "Default tax rate must be between 0 and 100.",
    ),
});

export const operationalRulesSettingsSchema = z.object({
  allowPartialPayments: z.boolean(),
  allowReleaseWithBalance: z.boolean(),
  requireFullPaymentBeforeRelease: z.boolean(),
  enableBarcodeSupport: z.boolean(),
  enableShelfLocation: z.boolean(),
});

export const documentSequenceSettingsSchema = z.object({
  key: z.enum(["quotation", "job_order", "invoice", "sale"]),
  prefix: z.string().trim().min(1, "Prefix is required.").max(10, "Prefix is too long."),
  padding: z
    .string()
    .trim()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 10,
      "Padding must be a whole number between 1 and 10.",
    ),
  lastValue: z
    .string()
    .trim()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Last value must be a whole number zero or greater.",
    ),
});

export function parseBusinessProfileSettingsFormData(formData: FormData) {
  return {
    businessName: readString(formData, "businessName"),
    businessAddress: readString(formData, "businessAddress"),
    businessContact: readString(formData, "businessContact"),
    businessEmail: readString(formData, "businessEmail"),
    receiptFooter: readString(formData, "receiptFooter"),
    defaultTaxRate: readString(formData, "defaultTaxRate"),
  };
}

export function parseOperationalRulesSettingsFormData(formData: FormData) {
  return {
    allowPartialPayments: readCheckbox(formData, "allowPartialPayments"),
    allowReleaseWithBalance: readCheckbox(formData, "allowReleaseWithBalance"),
    requireFullPaymentBeforeRelease: readCheckbox(formData, "requireFullPaymentBeforeRelease"),
    enableBarcodeSupport: readCheckbox(formData, "enableBarcodeSupport"),
    enableShelfLocation: readCheckbox(formData, "enableShelfLocation"),
  };
}

export function parseDocumentSequenceSettingsFormData(formData: FormData): {
  key: SettingsDocumentSequenceKey;
  prefix: string;
  padding: string;
  lastValue: string;
} {
  return {
    key: readString(formData, "key") as SettingsDocumentSequenceKey,
    prefix: readString(formData, "prefix"),
    padding: readString(formData, "padding"),
    lastValue: readString(formData, "lastValue"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
