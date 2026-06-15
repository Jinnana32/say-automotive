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
  businessVatRegistrationNo: z.string().trim().max(100, "VAT registration number is too long."),
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
  allowGlobalProductCatalog: z.boolean(),
  allowGlobalServiceCatalog: z.boolean(),
  allowPartialPayments: z.boolean(),
  requireInvoiceBeforeJobCompletion: z.boolean(),
  requireInvoiceBeforeVehicleRelease: z.boolean(),
  allowReleaseWithBalance: z.boolean(),
  requireFullPaymentBeforeRelease: z.boolean(),
  requireAdditionalItemPreApproval: z.boolean(),
  enableBarcodeSupport: z.boolean(),
  enableShelfLocation: z.boolean(),
  payrollStandardDailyHours: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 24,
      "Standard daily hours must be between 0 and 24.",
    ),
  payrollHolidayPremiumRate: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1000,
      "Holiday premium rate must be between 0 and 1000 percent.",
    ),
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
    businessVatRegistrationNo: readString(formData, "businessVatRegistrationNo"),
    receiptFooter: readString(formData, "receiptFooter"),
    defaultTaxRate: readString(formData, "defaultTaxRate"),
  };
}

export function parseOperationalRulesSettingsFormData(formData: FormData) {
  return {
    allowGlobalProductCatalog: readCheckbox(formData, "allowGlobalProductCatalog"),
    allowGlobalServiceCatalog: readCheckbox(formData, "allowGlobalServiceCatalog"),
    allowPartialPayments: readCheckbox(formData, "allowPartialPayments"),
    requireInvoiceBeforeJobCompletion: readCheckbox(formData, "requireInvoiceBeforeJobCompletion"),
    requireInvoiceBeforeVehicleRelease: readCheckbox(
      formData,
      "requireInvoiceBeforeVehicleRelease",
    ),
    allowReleaseWithBalance: readCheckbox(formData, "allowReleaseWithBalance"),
    requireFullPaymentBeforeRelease: readCheckbox(formData, "requireFullPaymentBeforeRelease"),
    requireAdditionalItemPreApproval: readCheckbox(formData, "requireAdditionalItemPreApproval"),
    enableBarcodeSupport: readCheckbox(formData, "enableBarcodeSupport"),
    enableShelfLocation: readCheckbox(formData, "enableShelfLocation"),
    payrollStandardDailyHours: readString(formData, "payrollStandardDailyHours"),
    payrollHolidayPremiumRate: readString(formData, "payrollHolidayPremiumRate"),
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
