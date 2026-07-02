import { describe, expect, it } from "vitest";

import { historicalServiceFormSchema } from "@/features/historical-service/schemas/historical-service-form-schema";

describe("historicalServiceFormSchema", () => {
  it("requires service date and either work performed or line items", () => {
    const missingWork = historicalServiceFormSchema.safeParse({
      vehicleId: "00000000-0000-4000-8000-000000000001",
      serviceDate: "2024-01-10",
      workPerformed: "",
      customerConcern: "",
      diagnosis: "",
      inspectionNotes: "",
      mileageIn: "",
      mileageOut: "",
      items: [],
    });

    expect(missingWork.success).toBe(false);

    const withWork = historicalServiceFormSchema.safeParse({
      vehicleId: "00000000-0000-4000-8000-000000000001",
      serviceDate: "2024-01-10",
      workPerformed: "Oil change",
      customerConcern: "",
      diagnosis: "",
      inspectionNotes: "",
      mileageIn: "",
      mileageOut: "",
      items: [],
    });

    expect(withWork.success).toBe(true);
  });
});
