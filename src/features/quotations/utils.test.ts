import { describe, expect, it } from "vitest";

import { canReviseQuotation, calculateQuotationTotals, createQuotationItem } from "@/features/quotations/utils";

describe("calculateQuotationTotals", () => {
  it("applies percentage discount and tax on the discounted subtotal", () => {
    const items = [
      createQuotationItem({
        itemType: "labor",
        description: "Inspection",
        quantity: "1",
        unitPrice: "1000.0000",
      }),
    ];

    const totals = calculateQuotationTotals({
      items,
      discount: "10",
      discountMode: "percent",
      taxRate: "12",
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.taxAmount).toBe(108);
    expect(totals.grandTotal).toBe(1008);
  });

  it("applies fixed discount and tax together", () => {
    const items = [
      createQuotationItem({
        itemType: "labor",
        description: "Inspection",
        quantity: "2",
        unitPrice: "500.0000",
      }),
    ];

    const totals = calculateQuotationTotals({
      items,
      discount: "100",
      discountMode: "fixed",
      taxRate: "12",
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.taxAmount).toBe(108);
    expect(totals.grandTotal).toBe(1008);
  });
});

describe("canReviseQuotation", () => {
  it("allows revise for approved quotations with an active editable job order", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "in_progress",
        hasActiveInvoice: false,
      }),
    ).toBe(true);
  });

  it("blocks revise without a linked job order", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: null,
        jobOrderStatus: null,
      }),
    ).toBe(false);
  });

  it("blocks revise when an active invoice exists", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "in_progress",
        hasActiveInvoice: true,
      }),
    ).toBe(false);
  });

  it("blocks revise for completed job orders", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "completed",
      }),
    ).toBe(false);
  });
});
