import { describe, expect, it } from "vitest";

import { serviceFormSchema } from "@/features/services/schemas/service-form-schema";

describe("serviceFormSchema", () => {
  it("rejects negative labor prices", () => {
    const result = serviceFormSchema.safeParse({
      name: "Oil Change",
      category: "",
      description: "",
      laborPrice: "-1",
      estimatedDurationMinutes: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid service input", () => {
    const result = serviceFormSchema.safeParse({
      name: "Oil Change",
      category: "Maintenance",
      description: "",
      laborPrice: "500",
      estimatedDurationMinutes: "45",
      status: "active",
    });

    expect(result.success).toBe(true);
  });
});
