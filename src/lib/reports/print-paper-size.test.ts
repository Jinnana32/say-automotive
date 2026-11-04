import { describe, expect, it } from "vitest";

import {
  applyPrintPaperSearchParam,
  resolvePrintPaperSize,
  scalePrintCapacity,
  withPrintPaperSearchParam,
} from "@/lib/reports/print-paper-size";

describe("print paper size helpers", () => {
  it("resolves known paper sizes and defaults unknown values to A4", () => {
    expect(resolvePrintPaperSize("a4")).toBe("a4");
    expect(resolvePrintPaperSize("short-bond")).toBe("short-bond");
    expect(resolvePrintPaperSize("legal")).toBe("a4");
    expect(resolvePrintPaperSize(null)).toBe("a4");
  });

  it("scales pagination capacity below full page height for print safety", () => {
    expect(scalePrintCapacity(10, "a4")).toBeCloseTo(9.2);
    expect(scalePrintCapacity(10, "short-bond")).toBeCloseTo(8.4);
  });

  it("adds and removes the paper query param from hrefs", () => {
    expect(withPrintPaperSearchParam("/quotations/1/print", "a4")).toBe(
      "/quotations/1/print",
    );
    expect(
      withPrintPaperSearchParam("/quotations/1/print?mode=parts", "short-bond"),
    ).toBe("/quotations/1/print?mode=parts&paper=short-bond");

    const url = new URL("https://example.com/job-orders/1/print?hidePrices=1");
    applyPrintPaperSearchParam(url, "short-bond");
    expect(url.searchParams.get("paper")).toBe("short-bond");
    applyPrintPaperSearchParam(url, "a4");
    expect(url.searchParams.get("paper")).toBeNull();
  });
});
