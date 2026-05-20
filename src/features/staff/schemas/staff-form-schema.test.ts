import { describe, expect, it } from "vitest";

import { staffFormSchema } from "@/features/staff/schemas/staff-form-schema";

describe("staffFormSchema", () => {
  it("requires first and last name", () => {
    const result = staffFormSchema.safeParse({
      role: "mechanic",
      firstName: "",
      lastName: "",
      documentTitle: "",
      contactNumber: "",
      address: "",
      sssNumber: "",
      philhealthNumber: "",
      tinNumber: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an optional document title for customer-facing print documents", () => {
    const result = staffFormSchema.safeParse({
      role: "admin",
      firstName: "Nia Grace",
      lastName: "Ariete",
      documentTitle: "Shop Manager",
      contactNumber: "",
      address: "",
      sssNumber: "",
      philhealthNumber: "",
      tinNumber: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      status: "active",
    });

    expect(result.success).toBe(true);
  });
});
