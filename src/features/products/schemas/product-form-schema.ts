import { z } from "zod";

import type { ProductFormValues } from "@/features/products/types";
import { isNonNegativeMoneyInput } from "@/lib/currency";

export const productFormSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Product name is required."),
  sku: z.string().trim(),
  barcode: z.string().trim(),
  categoryId: z.string().trim(),
  brandId: z.string().trim(),
  supplierId: z.string().trim(),
  unitId: z.string().uuid("Unit is required."),
  partNumber: z.string().trim(),
  oemNumber: z.string().trim(),
  description: z.string().trim(),
  productType: z.enum(["part", "fluid", "consumable", "accessory", "tool"]),
  costPrice: z
    .string()
    .trim()
    .refine(isNonNegativeMoneyInput, "Cost price must be zero or greater with up to 2 decimal places."),
  sellingPrice: z
    .string()
    .trim()
    .refine(isNonNegativeMoneyInput, "Selling price must be zero or greater with up to 2 decimal places."),
  reorderLevel: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, "Reorder level must be zero or greater."),
  warrantyDurationDays: z
    .string()
    .trim()
    .refine((value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0), "Warranty duration must be a whole number of days."),
  shelfLocation: z.string().trim(),
  websiteVisible: z.boolean(),
  websiteFeatured: z.boolean(),
  websiteSortOrder: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, "Website sort order must be a whole number zero or greater."),
  websiteSlug: z.string().trim(),
  websiteImageUrl: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//i.test(value), "Enter a full image URL."),
  websiteShortDescription: z.string().trim(),
  websiteBadge: z.string().trim(),
  status: z.enum(["active", "inactive"]),
}).superRefine((value, ctx) => {
  if (value.websiteFeatured && !value.websiteVisible) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["websiteFeatured"],
      message: "Featured products must also be visible on the website.",
    });
  }

  if (value.websiteVisible && !value.websiteShortDescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["websiteShortDescription"],
      message: "Add a short public description before publishing this product.",
    });
  }
});

export function parseProductFormData(formData: FormData): ProductFormValues {
  return {
    productId: readString(formData, "productId") || undefined,
    name: readString(formData, "name"),
    sku: readString(formData, "sku"),
    barcode: readString(formData, "barcode"),
    categoryId: readString(formData, "categoryId"),
    brandId: readString(formData, "brandId"),
    supplierId: readString(formData, "supplierId"),
    unitId: readString(formData, "unitId"),
    partNumber: readString(formData, "partNumber"),
    oemNumber: readString(formData, "oemNumber"),
    description: readString(formData, "description"),
    productType: readString(formData, "productType") as ProductFormValues["productType"],
    costPrice: readString(formData, "costPrice"),
    sellingPrice: readString(formData, "sellingPrice"),
    reorderLevel: readString(formData, "reorderLevel"),
    warrantyDurationDays: readString(formData, "warrantyDurationDays"),
    shelfLocation: readString(formData, "shelfLocation"),
    websiteVisible: readBoolean(formData, "websiteVisible"),
    websiteFeatured: readBoolean(formData, "websiteFeatured"),
    websiteSortOrder: readString(formData, "websiteSortOrder"),
    websiteSlug: readString(formData, "websiteSlug"),
    websiteImageUrl: readString(formData, "websiteImageUrl"),
    websiteShortDescription: readString(formData, "websiteShortDescription"),
    websiteBadge: readString(formData, "websiteBadge"),
    status: readString(formData, "status") as ProductFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
