import { describe, expect, it } from "vitest";

import { websitePostFormSchema } from "@/features/website/schemas/website-post-schema";

describe("websitePostFormSchema", () => {
  it("requires the title, excerpt, and content", () => {
    const result = websitePostFormSchema.safeParse({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      category: "shop_update",
      isFeatured: false,
      status: "active",
    });

    expect(result.success).toBe(false);
  });
});
