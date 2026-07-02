import { z } from "zod";

import type { HistoricalServiceFormItem } from "@/features/historical-service/types";
import { isNonNegativeMoneyInput } from "@/lib/currency";

const historicalServiceItemSchema = z.object({
  key: z.string().min(1),
  itemType: z.enum(["labor", "service"]),
  description: z.string().trim().min(1, "Description is required."),
  quantity: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Quantity must be greater than zero."),
  unitPrice: z
    .string()
    .trim()
    .refine(isNonNegativeMoneyInput, "Unit price must be zero or greater with up to 4 decimal places."),
});

export const historicalServiceFormSchema = z
  .object({
    vehicleId: z.string().uuid("Vehicle is required."),
    serviceDate: z.string().trim().min(1, "Service date is required."),
    workPerformed: z.string().trim().max(4000, "Work performed is too long."),
    customerConcern: z.string().trim().max(2000, "Customer concern is too long."),
    diagnosis: z.string().trim().max(4000, "Diagnosis is too long."),
    inspectionNotes: z.string().trim().max(4000, "Inspection notes are too long."),
    mileageIn: z.string().trim(),
    mileageOut: z.string().trim(),
    items: z.array(historicalServiceItemSchema),
  })
  .superRefine((value, ctx) => {
    const mileageIn = parseOptionalNumeric(value.mileageIn);
    const mileageOut = parseOptionalNumeric(value.mileageOut);

    if (mileageIn !== null && mileageIn < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage in must be zero or greater.",
        path: ["mileageIn"],
      });
    }

    if (mileageOut !== null && mileageOut < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage out must be zero or greater.",
        path: ["mileageOut"],
      });
    }

    if (mileageIn !== null && mileageOut !== null && mileageOut < mileageIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage out cannot be less than mileage in.",
        path: ["mileageOut"],
      });
    }

    if (!value.workPerformed.trim() && value.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe what was done or add at least one line item.",
        path: ["workPerformed"],
      });
    }
  });

export function parseHistoricalServiceFormData(formData: FormData) {
  return {
    vehicleId: readString(formData, "vehicleId"),
    serviceDate: readString(formData, "serviceDate"),
    workPerformed: readString(formData, "workPerformed"),
    customerConcern: readString(formData, "customerConcern"),
    diagnosis: readString(formData, "diagnosis"),
    inspectionNotes: readString(formData, "inspectionNotes"),
    mileageIn: readString(formData, "mileageIn"),
    mileageOut: readString(formData, "mileageOut"),
    items: parseItems(readString(formData, "itemsJson")),
  };
}

export function serializeHistoricalServiceItems(items: HistoricalServiceFormItem[]) {
  return JSON.stringify(items);
}

function parseItems(value: string): HistoricalServiceFormItem[] {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as HistoricalServiceFormItem[];
  } catch {
    return [];
  }
}

function parseOptionalNumeric(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
