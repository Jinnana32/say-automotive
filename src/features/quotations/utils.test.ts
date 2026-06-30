import { describe, expect, it } from "vitest";

import { canReviseQuotation } from "@/features/quotations/utils";

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
