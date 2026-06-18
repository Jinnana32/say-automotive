import { z } from "zod";

import type {
  BranchHolidayFormValues,
  PhilippineHolidayImportFormValues,
} from "@/features/attendance/types";

const BRANCH_HOLIDAY_KINDS = [
  "branch_closure",
  "public_holiday",
  "company_holiday",
  "special_non_working_day",
] as const;
const BRANCH_HOLIDAY_PAY_TREATMENTS = ["unpaid", "paid_regular_day", "custom"] as const;

export const branchHolidaySchema = z.object({
  holidayId: z.string().trim(),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid holiday date."),
  label: z.string().trim().min(2, "Enter a label or reason.").max(120, "Label must be 120 characters or fewer."),
  holidayKind: z.enum(BRANCH_HOLIDAY_KINDS, {
    message: "Select an event type.",
  }),
  payTreatment: z.enum(BRANCH_HOLIDAY_PAY_TREATMENTS, {
    message: "Select a pay treatment.",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
});

export const philippineHolidayImportSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  selections: z
    .array(
      z.object({
        suggestionId: z.string().trim().min(1),
        payTreatment: z.enum(BRANCH_HOLIDAY_PAY_TREATMENTS, {
          message: "Select a pay treatment.",
        }),
      }),
    )
    .min(1, "Select at least one holiday to import."),
});

export function parseBranchHolidayFormData(formData: FormData): BranchHolidayFormValues {
  return {
    holidayId: readString(formData, "holidayId"),
    holidayDate: readString(formData, "holidayDate"),
    label: readString(formData, "label"),
    holidayKind: readString(formData, "holidayKind") as BranchHolidayFormValues["holidayKind"],
    payTreatment: readString(formData, "payTreatment") as BranchHolidayFormValues["payTreatment"],
    notes: readString(formData, "notes"),
  };
}

export function parsePhilippineHolidayImportFormData(
  formData: FormData,
): PhilippineHolidayImportFormValues {
  const rawSelections = readString(formData, "selectedSuggestions");
  const parsedSelections = safeParseSelections(rawSelections);

  return {
    year: readString(formData, "year"),
    selections: parsedSelections,
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function safeParseSelections(value: string): PhilippineHolidayImportFormValues["selections"] {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as PhilippineHolidayImportFormValues["selections"]) : [];
  } catch {
    return [];
  }
}
