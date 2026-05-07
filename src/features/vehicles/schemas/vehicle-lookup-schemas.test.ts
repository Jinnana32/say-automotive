import { describe, expect, it } from "vitest";

import {
  vehicleLookupOptionFormSchema,
  vehicleMakeFormSchema,
  vehicleModelFormSchema,
} from "@/features/vehicles/schemas/vehicle-lookup-schemas";

describe("vehicle lookup schemas", () => {
  it("requires a make name", () => {
    const result = vehicleMakeFormSchema.safeParse({
      name: "",
      sortOrder: "0",
    });

    expect(result.success).toBe(false);
  });

  it("requires a valid make for models", () => {
    const result = vehicleModelFormSchema.safeParse({
      makeId: "not-a-uuid",
      name: "Vios",
      sortOrder: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts supported lookup types only", () => {
    const valid = vehicleLookupOptionFormSchema.safeParse({
      lookupType: "fuel_type",
      label: "Diesel",
      sortOrder: "20",
    });
    const invalid = vehicleLookupOptionFormSchema.safeParse({
      lookupType: "variant",
      label: "G",
      sortOrder: "10",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
