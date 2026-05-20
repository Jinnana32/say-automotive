import { describe, expect, it } from "vitest";

import {
  cancelInvoiceSchema,
  createInvoiceFromJobOrderSchema,
  recordInvoicePaymentSchema,
  releaseJobOrderVehicleSchema,
} from "@/features/invoices/schemas/invoice-forms";

describe("invoice forms", () => {
  it("requires a valid job order id when creating an invoice", () => {
    const parsed = createInvoiceFromJobOrderSchema.safeParse({
      jobOrderId: "not-a-uuid",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects non-positive payment amounts", () => {
    const parsed = recordInvoicePaymentSchema.safeParse({
      invoiceId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      jobOrderId: "9868e516-a49f-4fe2-86d4-c5f84cd6f18a",
      amount: "0",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts four-decimal payment amounts and the other method", () => {
    const parsed = recordInvoicePaymentSchema.safeParse({
      invoiceId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      jobOrderId: "9868e516-a49f-4fe2-86d4-c5f84cd6f18a",
      amount: "10.1234",
      paymentMethod: "other",
      referenceNumber: "",
      notes: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("requires a valid job order id when releasing a vehicle", () => {
    const parsed = releaseJobOrderVehicleSchema.safeParse({
      jobOrderId: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a cancellation reason when voiding an invoice", () => {
    const parsed = cancelInvoiceSchema.safeParse({
      invoiceId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      cancellationReason: "   ",
    });

    expect(parsed.success).toBe(false);
  });
});
