import { describe, expect, it } from "vitest";

import { completePosSaleSchema } from "@/features/pos/schemas/pos-form-schema";

describe("pos form schema", () => {
  it("requires at least one product", () => {
    const parsed = completePosSaleSchema.safeParse({
      customerId: undefined,
      discount: "0",
      paymentAmount: "100",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      items: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate products in the cart payload", () => {
    const parsed = completePosSaleSchema.safeParse({
      customerId: undefined,
      discount: "0",
      paymentAmount: "100",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      items: [
        { productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd", quantity: 1 },
        { productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd", quantity: 2 },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a positive payment amount", () => {
    const parsed = completePosSaleSchema.safeParse({
      customerId: undefined,
      discount: "0",
      paymentAmount: "0",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      items: [{ productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd", quantity: 1 }],
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts four-decimal money inputs and the other payment method", () => {
    const parsed = completePosSaleSchema.safeParse({
      customerId: undefined,
      discount: "0.1234",
      paymentAmount: "100.0001",
      paymentMethod: "other",
      referenceNumber: "",
      notes: "",
      items: [{ productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd", quantity: 1 }],
    });

    expect(parsed.success).toBe(true);
  });
});
