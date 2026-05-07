import { DateTime } from "luxon";
import { z } from "zod";

import type { StaffLeaveFormValues } from "@/features/attendance/types";

const STAFF_LEAVE_TYPES = ["vacation", "sick", "emergency", "unpaid", "other"] as const;

export const staffLeaveSchema = z
  .object({
    leaveEntryId: z.string().trim(),
    staffId: z.string().uuid("Select a staff member."),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid start date."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid end date."),
    leaveType: z.enum(STAFF_LEAVE_TYPES, {
      message: "Select a leave type.",
    }),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
  })
  .superRefine((values, context) => {
    const startDate = DateTime.fromISO(values.startDate);
    const endDate = DateTime.fromISO(values.endDate);

    if (startDate.isValid && endDate.isValid && endDate < startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export function parseStaffLeaveFormData(formData: FormData): StaffLeaveFormValues {
  return {
    leaveEntryId: readString(formData, "leaveEntryId"),
    staffId: readString(formData, "staffId"),
    startDate: readString(formData, "startDate"),
    endDate: readString(formData, "endDate"),
    leaveType: readString(formData, "leaveType") as StaffLeaveFormValues["leaveType"],
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
