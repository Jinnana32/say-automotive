import { DateTime } from "luxon";
import { z } from "zod";

import type { StaffScheduleFormValues } from "@/features/attendance/types";

export const staffScheduleSchema = z
  .object({
    staffId: z.string().uuid("Select a staff member."),
    shiftStartTime: z.string().trim().refine((value) => isValidTime(value), {
      message: "Enter a valid shift start time.",
    }),
    shiftEndTime: z.string().trim().refine((value) => isValidTime(value), {
      message: "Enter a valid shift end time.",
    }),
    graceMinutes: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 240, {
        message: "Grace minutes must be between 0 and 240.",
      }),
    mondayIsWorkday: z.boolean(),
    tuesdayIsWorkday: z.boolean(),
    wednesdayIsWorkday: z.boolean(),
    thursdayIsWorkday: z.boolean(),
    fridayIsWorkday: z.boolean(),
    saturdayIsWorkday: z.boolean(),
    sundayIsWorkday: z.boolean(),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
  })
  .superRefine((values, context) => {
    const activeWorkdayCount = [
      values.mondayIsWorkday,
      values.tuesdayIsWorkday,
      values.wednesdayIsWorkday,
      values.thursdayIsWorkday,
      values.fridayIsWorkday,
      values.saturdayIsWorkday,
      values.sundayIsWorkday,
    ].filter(Boolean).length;

    if (activeWorkdayCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mondayIsWorkday"],
        message: "Select at least one working day.",
      });
    }

    const startTime = parseTime(values.shiftStartTime);
    const endTime = parseTime(values.shiftEndTime);

    if (startTime && endTime && endTime <= startTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shiftEndTime"],
        message: "Shift end time must be later than shift start time.",
      });
    }
  });

export function parseStaffScheduleFormData(formData: FormData): StaffScheduleFormValues {
  return {
    staffId: readString(formData, "staffId"),
    shiftStartTime: readString(formData, "shiftStartTime"),
    shiftEndTime: readString(formData, "shiftEndTime"),
    graceMinutes: readString(formData, "graceMinutes"),
    mondayIsWorkday: readCheckbox(formData, "mondayIsWorkday"),
    tuesdayIsWorkday: readCheckbox(formData, "tuesdayIsWorkday"),
    wednesdayIsWorkday: readCheckbox(formData, "wednesdayIsWorkday"),
    thursdayIsWorkday: readCheckbox(formData, "thursdayIsWorkday"),
    fridayIsWorkday: readCheckbox(formData, "fridayIsWorkday"),
    saturdayIsWorkday: readCheckbox(formData, "saturdayIsWorkday"),
    sundayIsWorkday: readCheckbox(formData, "sundayIsWorkday"),
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function isValidTime(value: string) {
  return parseTime(value) !== null;
}

function parseTime(value: string) {
  const parsed = DateTime.fromFormat(value, "HH:mm");
  return parsed.isValid ? parsed : null;
}
