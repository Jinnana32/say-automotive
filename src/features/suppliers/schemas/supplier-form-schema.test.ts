import { describe, expect, it } from "vitest";

import { supplierFormSchema } from "@/features/suppliers/schemas/supplier-form-schema";

describe("supplierFormSchema", () => {
  it("requires supplier name", () => {
    const result = supplierFormSchema.safeParse({
      supplierName: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
      address: "",
      paymentTerms: "",
      notes: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });
});
