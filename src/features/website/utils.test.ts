import { describe, expect, it } from "vitest";

import {
  getWebsitePostCategoryLabel,
  getWebsiteQuoteRequestTone,
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
});
