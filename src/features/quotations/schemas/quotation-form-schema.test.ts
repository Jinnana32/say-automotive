import { describe, expect, it } from "vitest";

import { quotationFormSchema } from "@/features/quotations/schemas/quotation-form-schema";
import { createQuotationItem } from "@/features/quotations/utils";

describe("quotationFormSchema", () => {
  it("requires product references for product items", () => {
    const result = quotationFormSchema.safeParse({
      customerId: crypto.randomUUID(),
      vehicleId: crypto.randomUUID(),
      natureOfRepair: "",
      inspectionNotes: "",
      status: "draft",
      discount: "0",
      tax: "0",
      items: [
        createQuotationItem({
          itemType: "product",
          description: "Brake Pad",
          quantity: "1",
          unitPrice: "1000",
        }),
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid mixed quotation items", () => {
    const result = quotationFormSchema.safeParse({
      customerId: crypto.randomUUID(),
      vehicleId: crypto.randomUUID(),
      natureOfRepair: "Change oil and filters",
      inspectionNotes: "",
      status: "pending_approval",
      discount: "0",
      tax: "0",
      items: [
        createQuotationItem({
          itemType: "service",
          serviceId: crypto.randomUUID(),
          description: "Oil Change",
          quantity: "1",
          unitPrice: "500",
        }),
        createQuotationItem({
          itemType: "labor",
          description: "Manual labor",
          quantity: "2",
          unitPrice: "300",
        }),
      ],
    });

    expect(result.success).toBe(true);
  });
});
