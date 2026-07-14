import { describe, expect, it } from "vitest";

import {
  customerFormSchema,
  deriveCustomerDisplayName,
} from "@/features/customers/schemas/customer-form-schema";

describe("customerFormSchema", () => {
  it("requires first and last name for individuals", () => {
    const result = customerFormSchema.safeParse({
      customerType: "individual",
      firstName: "",
      lastName: "",
      companyName: "",
      contactNumber: "",
      contactNumberSecondary: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("derives display name for company customers", () => {
    const displayName = deriveCustomerDisplayName({
      customerType: "company",
      firstName: "",
      lastName: "",
      companyName: "ABC Fleet Services",
      contactNumber: "",
      contactNumberSecondary: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
    });

    expect(displayName).toBe("ABC Fleet Services");
  });
});
