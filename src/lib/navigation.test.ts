import { describe, expect, it } from "vitest";

import { DASHBOARD_NAV_ITEMS, navigationItemMatchesPath, resolveActiveNavigationItem } from "@/lib/navigation";

describe("navigationItemMatchesPath", () => {
  it("matches exact paths and nested paths without false positives", () => {
    expect(navigationItemMatchesPath("/settings", "/settings")).toBe(true);
    expect(navigationItemMatchesPath("/settings", "/settings/website")).toBe(true);
    expect(navigationItemMatchesPath("/settings", "/settings-archive")).toBe(false);
  });
});

describe("resolveActiveNavigationItem", () => {
  it("returns the most specific matching navigation item", () => {
    const activeItem = resolveActiveNavigationItem(DASHBOARD_NAV_ITEMS, "/settings/website/journal");

    expect(activeItem?.href).toBe("/settings/website");
    expect(activeItem?.label).toBe("Website");
  });

  it("falls back to the first item when no match exists", () => {
    const activeItem = resolveActiveNavigationItem(DASHBOARD_NAV_ITEMS, "/missing-route");

    expect(activeItem?.href).toBe("/dashboard");
  });

  it("matches the blank document preview route in the sidebar", () => {
    const activeItem = resolveActiveNavigationItem(
      DASHBOARD_NAV_ITEMS,
      "/documents/blank-preview",
    );

    expect(activeItem?.href).toBe("/documents/blank-preview");
    expect(activeItem?.label).toBe("Blank Document");
  });
});
