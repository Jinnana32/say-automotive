import { z } from "zod";

import type { BranchHolidayFormValues } from "@/features/attendance/types";

const BRANCH_HOLIDAY_KINDS = ["regular", "special", "branch_closure", "other"] as const;

export const branchHolidaySchema = z.object({
  holidayId: z.string().trim(),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid holiday date."),
  label: z.string().trim().min(2, "Enter a holiday label.").max(120, "Label must be 120 characters or fewer."),
  holidayKind: z.enum(BRANCH_HOLIDAY_KINDS, {
    message: "Select a holiday type.",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
});

export function parseBranchHolidayFormData(formData: FormData): BranchHolidayFormValues {
  return {
    holidayId: readString(formData, "holidayId"),
    holidayDate: readString(formData, "holidayDate"),
    label: readString(formData, "label"),
    holidayKind: readString(formData, "holidayKind") as BranchHolidayFormValues["holidayKind"],
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
