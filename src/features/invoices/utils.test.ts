import { describe, expect, it } from "vitest";

import {
  canCancelInvoice,
  canRecordInvoicePayment,
  canReleaseInvoiceVehicle,
  formatInvoiceStatus,
  formatPaymentMethod,
  toNumeric,
} from "@/features/invoices/utils";

describe("invoice utils", () => {
  it("allows payment only while a non-cancelled invoice still has balance", () => {
    expect(canRecordInvoicePayment({ status: "unpaid", balance: 1500 })).toBe(true);
    expect(canRecordInvoicePayment({ status: "paid", balance: 0 })).toBe(false);
    expect(canRecordInvoicePayment({ status: "cancelled", balance: 1500 })).toBe(false);
  });

  it("allows vehicle release only for active job-order invoices that are not already released", () => {
    expect(
      canReleaseInvoiceVehicle({
        jobOrderId: "job-order-1",
        status: "partially_paid",
        releasedAt: null,
      }),
    ).toBe(true);

    expect(
      canReleaseInvoiceVehicle({
        jobOrderId: null,
        status: "paid",
        releasedAt: null,
      }),
    ).toBe(false);

    expect(
      canReleaseInvoiceVehicle({
        jobOrderId: "job-order-1",
        status: "cancelled",
        releasedAt: null,
      }),
    ).toBe(false);
  });

  it("allows cancellation only for unpaid, unreleased, non-POS invoices", () => {
    expect(
      canCancelInvoice({
        status: "unpaid",
        paidAmount: 0,
        saleId: null,
        releasedAt: null,
      }),
    ).toBe(true);

    expect(
      canCancelInvoice({
        status: "partially_paid",
        paidAmount: 500,
        saleId: null,
        releasedAt: null,
      }),
    ).toBe(false);

    expect(
      canCancelInvoice({
        status: "unpaid",
        paidAmount: 0,
        saleId: "sale-1",
        releasedAt: null,
      }),
    ).toBe(false);
  });

  it("formats labels and normalizes numeric inputs", () => {
    expect(formatInvoiceStatus("partially_paid")).toBe("partially paid");
    expect(formatPaymentMethod("bank_transfer")).toBe("Bank Transfer");
    expect(formatPaymentMethod("other")).toBe("Other");
    expect(toNumeric("1250.75")).toBe(1250.75);
    expect(toNumeric("abc")).toBe(0);
  });
});
