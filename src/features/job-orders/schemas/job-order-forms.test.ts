import { describe, expect, it } from "vitest";

import {
  additionalJobOrderItemSchema,
  jobOrderDetailsSchema,
  jobOrderItemEditSchema,
  jobOrderPartUsageSchema,
} from "@/features/job-orders/schemas/job-order-forms";

describe("job order forms", () => {
  it("accepts mileage out without mileage in", () => {
    const parsed = jobOrderDetailsSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      mileageIn: "",
      mileageOut: "26000",
      customerConcern: "",
      inspectionNotes: "",
      diagnosis: "",
      workPerformed: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects mileage out below mileage in", () => {
    const parsed = jobOrderDetailsSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      mileageIn: "20000",
      mileageOut: "15000",
      customerConcern: "",
      inspectionNotes: "",
      diagnosis: "",
      workPerformed: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires the correct reference for additional items", () => {
    const parsed = additionalJobOrderItemSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      itemType: "product",
      productId: "",
      serviceId: "",
      description: "Brake pads",
      quantity: "1",
      unitPrice: "1200",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts product additional items without an explicit description", () => {
    const parsed = additionalJobOrderItemSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      itemType: "product",
      productId: "9868e516-a49f-4fe2-86d4-c5f84cd6f18a",
      serviceId: "",
      description: "",
      quantity: "1",
      unitPrice: "1200",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects labor additional items without a description", () => {
    const parsed = additionalJobOrderItemSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      itemType: "labor",
      productId: "",
      serviceId: "",
      description: "",
      quantity: "1",
      unitPrice: "1200",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects additional item unit prices beyond four decimal places", () => {
    const parsed = additionalJobOrderItemSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      itemType: "labor",
      productId: "",
      serviceId: "",
      description: "Brake pads",
      quantity: "1",
      unitPrice: "1200.12345",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid work item edit quantities", () => {
    const parsed = jobOrderItemEditSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      jobOrderItemId: "9868e516-a49f-4fe2-86d4-c5f84cd6f18a",
      description: "Brake pads",
      quantity: "0",
      unitPrice: "1200",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects zero quantity for part usage", () => {
    const parsed = jobOrderPartUsageSchema.safeParse({
      jobOrderId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      jobOrderItemId: "9868e516-a49f-4fe2-86d4-c5f84cd6f18a",
      quantity: "0",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });
});
