import { z } from "zod";

import type { WebsiteQuoteRequestFormValues } from "@/features/website/types";

const currentYear = new Date().getFullYear() + 1;

export const websiteQuoteRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  contactNumber: z.string().trim(),
  email: z.string().trim().email("Enter a valid email address."),
  province: z.string().trim().min(1, "Province is required."),
  city: z.string().trim().min(1, "City is required."),
  barangay: z.string().trim().min(1, "Barangay is required."),
  vehicleMake: z.string().trim().min(1, "Vehicle make is required."),
  vehicleModel: z.string().trim().min(1, "Vehicle model is required."),
  vehicleYear: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        (Number.isInteger(Number(value)) &&
          Number(value) >= 1950 &&
          Number(value) <= currentYear),
      "Enter a valid model year.",
    ),
  transmission: z.string().trim().min(1, "Transmission is required."),
  mileage: z.string().trim().min(1, "Mileage is required."),
  engineSize: z.string().trim(),
  oilRequirementLiters: z
    .string()
    .trim()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Oil requirement must be zero or greater.",
    ),
  serviceNeeded: z.string().trim().min(1, "Service needed is required."),
  customerConcern: z.string().trim().min(1, "Tell us what your car needs."),
});

export function parseWebsiteQuoteRequestFormData(
  formData: FormData,
): WebsiteQuoteRequestFormValues {
  return {
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    contactNumber: readString(formData, "contactNumber"),
    email: readString(formData, "email"),
    province: readString(formData, "province"),
    city: readString(formData, "city"),
    barangay: readString(formData, "barangay"),
    vehicleMake: readString(formData, "vehicleMake"),
    vehicleModel: readString(formData, "vehicleModel"),
    vehicleYear: readString(formData, "vehicleYear"),
    transmission: readString(formData, "transmission"),
    mileage: readString(formData, "mileage"),
    engineSize: readString(formData, "engineSize"),
    oilRequirementLiters: readString(formData, "oilRequirementLiters"),
    serviceNeeded: readString(formData, "serviceNeeded"),
    customerConcern: readString(formData, "customerConcern"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
