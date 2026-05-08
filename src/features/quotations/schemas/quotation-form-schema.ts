import { z } from "zod";

import type { QuotationFormItem, QuotationFormValues } from "@/features/quotations/types";

const quotationItemSchema = z
  .object({
    key: z.string().min(1),
    itemType: z.enum(["product", "service", "labor"]),
    productId: z.string().trim(),
    serviceId: z.string().trim(),
    description: z.string().trim().min(1, "Description is required."),
    quantity: z
      .string()
      .trim()
      .refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
    unitPrice: z
      .string()
      .trim()
      .refine((value) => Number(value) >= 0, "Unit price must be zero or greater."),
  })
  .superRefine((value, ctx) => {
    if (value.itemType === "product" && !value.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Select a product for product line items.",
      });
    }

    if (value.itemType === "service" && !value.serviceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serviceId"],
        message: "Select a service for service line items.",
      });
    }
  });

export const quotationFormSchema = z.object({
  quotationId: z.string().uuid().optional(),
  customerId: z.string().uuid("Customer is required."),
  vehicleId: z.string().uuid("Vehicle is required."),
  natureOfRepair: z.string().trim(),
  inspectionNotes: z.string().trim(),
  status: z.enum(["draft", "pending_approval"]),
  discount: z
    .string()
    .trim()
    .refine((value) => Number(value) >= 0, "Discount must be zero or greater."),
  tax: z
    .string()
    .trim()
    .refine((value) => Number(value) >= 0, "Tax must be zero or greater."),
  items: z.array(quotationItemSchema).min(1, "At least one quotation item is required."),
});

export function parseQuotationFormData(formData: FormData): QuotationFormValues {
  return {
    quotationId: readString(formData, "quotationId") || undefined,
    customerId: readString(formData, "customerId"),
    vehicleId: readString(formData, "vehicleId"),
    natureOfRepair: readString(formData, "natureOfRepair"),
    inspectionNotes: readString(formData, "inspectionNotes"),
    status: readString(formData, "status") as QuotationFormValues["status"],
    discount: readString(formData, "discount"),
    tax: readString(formData, "tax"),
    items: parseItems(readString(formData, "itemsJson")),
  };
}

export function serializeQuotationItems(items: QuotationFormItem[]) {
  return JSON.stringify(items);
}

function parseItems(value: string): QuotationFormItem[] {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as QuotationFormItem[];
  } catch {
    return [];
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
