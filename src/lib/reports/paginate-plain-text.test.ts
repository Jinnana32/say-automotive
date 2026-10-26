import { describe, expect, it } from "vitest";

import { paginatePlainText } from "@/lib/reports/paginate-plain-text";

describe("paginatePlainText", () => {
  it("keeps short text on a single page", () => {
    const pages = paginatePlainText("Hello world", (chunk) => chunk.length, 100);
    expect(pages).toEqual(["Hello world"]);
  });

  it("splits overflowing text onto multiple pages at word boundaries", () => {
    const text = "one two three four five six seven eight";
    const pages = paginatePlainText(text, (chunk) => chunk.length, 14);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.join(" ").replace(/\s+/g, " ").trim()).toBe(text);
    for (const page of pages) {
      expect(page.length).toBeLessThanOrEqual(14);
    }
  });

  it("prefers newline breaks when available", () => {
    const text = "first line of content\nsecond line continues here\nthird";
    const pages = paginatePlainText(text, (chunk) => chunk.length, 24);

    expect(pages[0]?.trimEnd()).toBe("first line of content");
    expect(pages.slice(1).join("\n")).toContain("second line");
  });
});
