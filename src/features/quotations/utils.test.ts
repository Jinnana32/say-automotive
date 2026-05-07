import { describe, expect, it } from "vitest";

import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
} from "@/features/quotations/utils";

describe("quotation utils", () => {
  it("calculates line totals", () => {
    const lineTotal = calculateQuotationLineTotal(
      createQuotationItem({ quantity: "2", unitPrice: "550.50" }),
    );

    expect(lineTotal).toBe(1101);
  });

  it("calculates subtotal and grand total", () => {
    const items = [
      createQuotationItem({ quantity: "2", unitPrice: "500" }),
      createQuotationItem({ quantity: "1", unitPrice: "250" }),
    ];

    expect(calculateQuotationSubtotal(items)).toBe(1250);
    expect(calculateQuotationGrandTotal({ items, discount: "100", tax: "12" })).toBe(1162);
  });
});
