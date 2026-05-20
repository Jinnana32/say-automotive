import { describe, expect, it } from "vitest";

import {
  getWebsitePostCategoryLabel,
  getWebsiteQuoteRequestTone,
  isUuidLike,
  resolveWebsiteProductRouteSegment,
  slugify,
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
});
