import { z } from "zod";

import type { ServiceFormValues } from "@/features/services/types";
import { isNonNegativeMoneyInput } from "@/lib/currency";

export const serviceFormSchema = z.object({
  serviceId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Service name is required."),
  category: z.string().trim(),
  description: z.string().trim(),
  laborPrice: z
    .string()
    .trim()
    .refine(isNonNegativeMoneyInput, "Labor price must be zero or greater with up to 2 decimal places."),
  estimatedDurationMinutes: z
    .string()
    .trim()
    .refine(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      "Estimated duration must be a whole number of minutes.",
    ),
  status: z.enum(["active", "inactive"]),
});

export function parseServiceFormData(formData: FormData): ServiceFormValues {
  return {
    serviceId: readString(formData, "serviceId") || undefined,
    name: readString(formData, "name"),
    category: readString(formData, "category"),
    description: readString(formData, "description"),
    laborPrice: readString(formData, "laborPrice"),
    estimatedDurationMinutes: readString(formData, "estimatedDurationMinutes"),
    status: readString(formData, "status") as ServiceFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
