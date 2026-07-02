import { describe, expect, it } from "vitest";

import { websiteQuoteRequestSchema } from "@/features/website/schemas/website-quote-request-schema";

describe("websiteQuoteRequestSchema", () => {
  it("requires the core lead and vehicle data", () => {
    const result = websiteQuoteRequestSchema.safeParse({
      firstName: "",
      lastName: "",
      contactNumber: "",
      email: "invalid",
      province: "",
      city: "",
      barangay: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "1900",
      transmission: "",
      mileage: "",
      engineSize: "",
      oilRequirementLiters: "-1",
      serviceNeeded: "",
      customerConcern: "",
    });

    expect(result.success).toBe(false);
  });

  it("allows an empty email when contact number is provided", () => {
    const result = websiteQuoteRequestSchema.safeParse({
      firstName: "Juan",
      lastName: "Cruz",
      contactNumber: "09171234567",
      email: "",
      province: "Cavite",
      city: "Bacoor",
      barangay: "Molino",
      vehicleMake: "Toyota",
      vehicleModel: "Vios",
      vehicleYear: "2018",
      transmission: "Automatic",
      mileage: "45000",
      engineSize: "",
      oilRequirementLiters: "",
      serviceNeeded: "Oil change",
      customerConcern: "Need a service quote.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("");
    }
  });
});
