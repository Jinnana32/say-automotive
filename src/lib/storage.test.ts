import { afterEach, describe, expect, it } from "vitest";

import { resolveProductImageUrl } from "@/lib/storage";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

describe("resolveProductImageUrl", () => {
  it("prefers the bucket-backed product image path when present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    expect(
      resolveProductImageUrl({
        productImagePath: "products/featured-oil.png",
        productImageUrl: "https://cdn.example.com/direct-image.png",
        websiteImageUrl: "https://cdn.example.com/website-image.png",
        cacheBust: "2026-05-20T12:00:00.000Z",
      }),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/business-assets/products/featured-oil.png?v=2026-05-20T12%3A00%3A00.000Z",
    );
  });

  it("falls back to the stored product image URL and then the website image URL", () => {
    expect(
      resolveProductImageUrl({
        productImagePath: null,
        productImageUrl: "https://cdn.example.com/direct-image.png",
        websiteImageUrl: "https://cdn.example.com/website-image.png",
      }),
    ).toBe("https://cdn.example.com/direct-image.png");

    expect(
      resolveProductImageUrl({
        productImagePath: null,
        productImageUrl: null,
        websiteImageUrl: "https://cdn.example.com/website-image.png",
      }),
    ).toBe("https://cdn.example.com/website-image.png");
  });
});
