import { describe, expect, it } from "vitest";

import { vehicleFormSchema } from "@/features/vehicles/schemas/vehicle-form-schema";

describe("vehicleFormSchema", () => {
  it("rejects invalid years", () => {
    const result = vehicleFormSchema.safeParse({
      customerId: crypto.randomUUID(),
      make: "Toyota",
      model: "Vios",
      year: "1800",
      transmission: "",
      mileage: "",
      plateNumber: "",
      vin: "",
      engineSize: "",
      variant: "",
      fuelType: "",
      color: "",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("accepts minimal valid vehicle input", () => {
    const result = vehicleFormSchema.safeParse({
      customerId: crypto.randomUUID(),
      make: "Toyota",
      model: "Hilux",
      year: "",
      transmission: "",
      mileage: "",
      plateNumber: "",
      vin: "",
      engineSize: "",
      variant: "",
      fuelType: "",
      color: "",
      status: "active",
    });

    expect(result.success).toBe(true);
  });
});
