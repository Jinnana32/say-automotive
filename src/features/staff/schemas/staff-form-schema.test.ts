import { describe, expect, it } from "vitest";

import { staffFormSchema } from "@/features/staff/schemas/staff-form-schema";

describe("staffFormSchema", () => {
  it("requires first and last name", () => {
    const result = staffFormSchema.safeParse({
      role: "mechanic",
      firstName: "",
      lastName: "",
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
});
