import { describe, expect, it } from "vitest";

import { buildQuotationPrintBreakdown } from "@/features/quotations/report-utils";
import type { QuotationDetail } from "@/features/quotations/types";

describe("buildQuotationPrintBreakdown", () => {
  it("groups product lines into parts and service or labor lines into labor", () => {
    const quotation = {
      items: [
        {
          id: "part-line",
          lineNumber: 1,
          itemType: "product",
          productId: "product-1",
          serviceId: null,
          description: "Oil Filter",
          quantity: 2,
          unitLabel: "pcs",
          unitPrice: 250,
          total: 500,
        },
        {
          id: "service-line",
          lineNumber: 2,
          itemType: "service",
          productId: null,
          serviceId: "service-1",
          description: "Change Oil",
          quantity: 1,
          unitLabel: null,
          unitPrice: 700,
          total: 700,
        },
        {
          id: "labor-line",
          lineNumber: 3,
          itemType: "labor",
          productId: null,
          serviceId: null,
          description: "Rust treatment",
          quantity: 2,
          unitLabel: null,
          unitPrice: 300,
          total: 600,
        },
      ],
      discount: 100,
      tax: 0,
      totalAmount: 1700,
    } satisfies Pick<QuotationDetail, "items" | "discount" | "tax" | "totalAmount">;

    const result = buildQuotationPrintBreakdown(quotation);

    expect(result.partLines).toEqual([
      {
        id: "part-line",
        description: "Oil Filter",
        quantityLabel: "2 pcs",
        unitPrice: 250,
        total: 500,
      },
    ]);
    expect(result.laborLines).toEqual([
      {
        id: "service-line",
        description: "Change Oil",
        total: 700,
      },
      {
        id: "labor-line",
        description: "Rust treatment (x2)",
        total: 600,
      },
    ]);
    expect(result.totalParts).toBe(500);
    expect(result.totalLabor).toBe(1300);
    expect(result.grandTotal).toBe(1700);
  });
});
