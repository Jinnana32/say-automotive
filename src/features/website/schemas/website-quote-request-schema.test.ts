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
});
