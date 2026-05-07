import { z } from "zod";

const posSaleItemSchema = z.object({
  productId: z.string().uuid("Product is required."),
  quantity: z.number().positive("Quantity must be greater than zero."),
});

export const completePosSaleSchema = z.object({
  customerId: z.string().uuid("Customer is invalid.").optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative."),
  paymentAmount: z.coerce.number().positive("Payment amount must be greater than zero."),
  paymentMethod: z.enum(["cash", "gcash", "card", "bank_transfer", "check"]),
  referenceNumber: z.string().trim().max(100, "Reference number is too long."),
  notes: z.string().trim().max(500, "Notes are too long."),
  items: z
    .array(posSaleItemSchema)
    .min(1, "Add at least one product to the POS cart.")
    .superRefine((items, context) => {
      const uniqueProductIds = new Set(items.map((item) => item.productId));

      if (uniqueProductIds.size !== items.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "Duplicate products are not allowed in the POS cart.",
        });
      }
    }),
});

export function parseCompletePosSaleFormData(formData: FormData) {
  return {
    customerId: readOptionalString(formData, "customerId"),
    discount: readString(formData, "discount"),
    paymentAmount: readString(formData, "paymentAmount"),
    paymentMethod: readString(formData, "paymentMethod"),
    referenceNumber: readString(formData, "referenceNumber"),
    notes: readString(formData, "notes"),
    items: readItems(formData),
  };
}

function readItems(formData: FormData) {
  const rawValue = formData.get("itemsJson");

  if (typeof rawValue !== "string" || !rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value ? value : undefined;
}
