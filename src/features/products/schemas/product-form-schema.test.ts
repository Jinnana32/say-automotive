import { describe, expect, it } from "vitest";

import { productFormSchema } from "@/features/products/schemas/product-form-schema";

describe("productFormSchema", () => {
  it("requires a unit and valid prices", () => {
    const result = productFormSchema.safeParse({
      name: "Brake Pad",
      sku: "",
      barcode: "",
      categoryId: "",
      brandId: "",
      supplierId: "",
      unitId: "",
      partNumber: "",
      oemNumber: "",
      description: "",
      productType: "part",
      costPrice: "-1",
      sellingPrice: "0",
      reorderLevel: "0",
      warrantyDurationDays: "",
      shelfLocation: "",
      websiteVisible: false,
      websiteFeatured: false,
      websiteSortOrder: "0",
      websiteSlug: "",
      productImageUrl: "",
      websiteImageUrl: "",
      websiteShortDescription: "",
      websiteBadge: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("accepts four-decimal prices and rejects more precise values", () => {
    const valid = productFormSchema.safeParse({
      name: "Brake Pad",
      sku: "",
      barcode: "",
      categoryId: "",
      brandId: "",
      supplierId: "",
      unitId: crypto.randomUUID(),
      partNumber: "",
      oemNumber: "",
      description: "",
      productType: "part",
      costPrice: "180.1234",
      sellingPrice: "250.5678",
      reorderLevel: "0",
      warrantyDurationDays: "",
      shelfLocation: "",
      websiteVisible: false,
      websiteFeatured: false,
      websiteSortOrder: "0",
      websiteSlug: "",
      productImageUrl: "",
      websiteImageUrl: "",
      websiteShortDescription: "",
      websiteBadge: "",
      status: "active",
    });
    const invalid = productFormSchema.safeParse({
      name: "Brake Pad",
      sku: "",
      barcode: "",
      categoryId: "",
      brandId: "",
      supplierId: "",
      unitId: crypto.randomUUID(),
      partNumber: "",
      oemNumber: "",
      description: "",
      productType: "part",
      costPrice: "180.12345",
      sellingPrice: "250.56",
      reorderLevel: "0",
      warrantyDurationDays: "",
      shelfLocation: "",
      websiteVisible: false,
      websiteFeatured: false,
      websiteSortOrder: "0",
      websiteSlug: "",
      productImageUrl: "",
      websiteImageUrl: "",
      websiteShortDescription: "",
      websiteBadge: "",
      status: "active",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
