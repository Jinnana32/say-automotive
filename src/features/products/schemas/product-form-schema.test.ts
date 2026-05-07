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
      websiteImageUrl: "",
      websiteShortDescription: "",
      websiteBadge: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });
});
