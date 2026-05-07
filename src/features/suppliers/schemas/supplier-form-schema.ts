import { z } from "zod";

import type { SupplierFormValues } from "@/features/suppliers/types";

export const supplierFormSchema = z.object({
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().trim().min(1, "Supplier name is required."),
  contactPerson: z.string().trim(),
  contactNumber: z.string().trim(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal(""))
    .transform((value) => value.trim()),
  address: z.string().trim(),
  paymentTerms: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(["active", "inactive"]),
});

export function parseSupplierFormData(formData: FormData): SupplierFormValues {
  return {
    supplierId: readString(formData, "supplierId") || undefined,
    supplierName: readString(formData, "supplierName"),
    contactPerson: readString(formData, "contactPerson"),
    contactNumber: readString(formData, "contactNumber"),
    email: readString(formData, "email"),
    address: readString(formData, "address"),
    paymentTerms: readString(formData, "paymentTerms"),
    notes: readString(formData, "notes"),
    status: readString(formData, "status") as SupplierFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
