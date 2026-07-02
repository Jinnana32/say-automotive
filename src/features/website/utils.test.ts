import { describe, expect, it } from "vitest";

import {
  getWebsitePostCategoryLabel,
  getWebsiteQuoteRequestTone,
  isPlaceholderWebsiteProductDescription,
  isUuidLike,
  resolveWebsiteProductDisplayDescription,
  resolveWebsiteProductRouteSegment,
  sanitizeWebsiteBrandName,
  sanitizeWebsiteProductName,
  slugify,
  WEBSITE_DEFAULT_PRODUCT_DESCRIPTION,
  WEBSITE_TIRE_PRODUCT_DESCRIPTION,
} from "@/features/website/utils";

describe("website utils", () => {
  it("slugifies text for public URLs", () => {
    expect(slugify("  235/45R18 Tire Package  ")).toBe("235-45r18-tire-package");
  });

  it("maps quote request statuses to badge tones", () => {
    expect(getWebsiteQuoteRequestTone("new")).toBe("warning");
    expect(getWebsiteQuoteRequestTone("quoted")).toBe("success");
  });

  it("labels public post categories", () => {
    expect(getWebsitePostCategoryLabel("shop_update")).toBe("Shop Update");
    expect(getWebsitePostCategoryLabel("maintenance_tip")).toBe("Maintenance Tip");
  });

  it("falls back to the product id when a website slug is blank", () => {
    expect(
      resolveWebsiteProductRouteSegment({
        id: "9a3a27ef-25f2-44b2-aa42-6d14b7d84040",
        websiteSlug: "   ",
      }),
    ).toBe("9a3a27ef-25f2-44b2-aa42-6d14b7d84040");
    expect(
      resolveWebsiteProductRouteSegment({
        id: "9a3a27ef-25f2-44b2-aa42-6d14b7d84040",
        websiteSlug: "engine-oil",
      }),
    ).toBe("engine-oil");
  });

  it("detects UUID-like route segments for product fallback lookups", () => {
    expect(isUuidLike("9a3a27ef-25f2-44b2-aa42-6d14b7d84040")).toBe(true);
    expect(isUuidLike("engine-oil")).toBe(false);
  });

  it("sanitizes placeholder catalog copy and brand typos", () => {
    expect(sanitizeWebsiteBrandName("Maxtrex")).toBe("Maxtrek");
    expect(sanitizeWebsiteProductName("Maxtrex 175-70-R13")).toBe("Maxtrek 175-70-R13");
    expect(isPlaceholderWebsiteProductDescription("sample test")).toBe(true);
    expect(isPlaceholderWebsiteProductDescription("simple parts")).toBe(true);
    expect(
      resolveWebsiteProductDisplayDescription({
        name: "Maxtrex 175-70-R13",
        shortDescription: "sample test",
        categoryName: "Tires",
      }),
    ).toBe(WEBSITE_TIRE_PRODUCT_DESCRIPTION);
    expect(
      resolveWebsiteProductDisplayDescription({
        name: "Engine oil",
        shortDescription: "simple parts",
        categoryName: "Fluids",
      }),
    ).toBe(WEBSITE_DEFAULT_PRODUCT_DESCRIPTION);
  });
});
