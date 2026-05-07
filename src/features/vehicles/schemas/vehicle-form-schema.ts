import { z } from "zod";

import type { VehicleFormValues } from "@/features/vehicles/types";

const currentYear = new Date().getFullYear();

export const vehicleFormSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  customerId: z.string().uuid("Customer is required."),
  make: z.string().trim().min(1, "Make is required."),
  model: z.string().trim().min(1, "Model is required."),
  year: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value || (Number.isInteger(Number(value)) && Number(value) >= 1900 && Number(value) <= currentYear + 1),
      "Year must be a valid 4-digit year.",
    ),
  transmission: z.string().trim(),
  mileage: z
    .string()
    .trim()
    .refine((value) => !value || Number(value) >= 0, "Mileage must be zero or greater."),
  plateNumber: z.string().trim(),
  vin: z.string().trim(),
  engineSize: z.string().trim(),
  variant: z.string().trim(),
  fuelType: z.string().trim(),
  color: z.string().trim(),
  status: z.enum(["active", "inactive"]),
});

export function parseVehicleFormData(formData: FormData): VehicleFormValues {
  return {
    vehicleId: readString(formData, "vehicleId") || undefined,
    customerId: readString(formData, "customerId"),
    make: readString(formData, "make"),
    model: readString(formData, "model"),
    year: readString(formData, "year"),
    transmission: readString(formData, "transmission"),
    mileage: readString(formData, "mileage"),
    plateNumber: readString(formData, "plateNumber"),
    vin: readString(formData, "vin"),
    engineSize: readString(formData, "engineSize"),
    variant: readString(formData, "variant"),
    fuelType: readString(formData, "fuelType"),
    color: readString(formData, "color"),
    status: readString(formData, "status") as VehicleFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
