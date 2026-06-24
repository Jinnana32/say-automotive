import { DateTime } from "luxon";
import { z } from "zod";

import { ATTENDANCE_STATUS_VALUES, isNonTimedAttendanceStatus } from "@/features/attendance/utils";
import type { AttendanceFormValues } from "@/features/attendance/types";

const BUSINESS_TIMEZONE = "Asia/Manila";
const LOCAL_DATE_TIME_FORMAT = "yyyy-LL-dd'T'HH:mm";

export const attendanceEntrySchema = z
  .object({
    staffId: z.string().uuid("Select a staff member."),
    attendanceDate: z
      .string()
      .trim()
      .refine((value) => DateTime.fromISO(value, { zone: BUSINESS_TIMEZONE }).isValid, {
        message: "Enter a valid attendance date.",
      }),
    status: z.enum(ATTENDANCE_STATUS_VALUES, {
      error: "Select an attendance status.",
    }),
    timeIn: z.string().trim(),
    timeOut: z.string().trim(),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
  })
  .superRefine((values, context) => {
    const hasTimeIn = values.timeIn.length > 0;
    const hasTimeOut = values.timeOut.length > 0;

    if (hasTimeIn && !isValidLocalDateTime(values.timeIn)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeIn"],
        message: "Enter a valid time in.",
      });
    }

    if (hasTimeOut && !isValidLocalDateTime(values.timeOut)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeOut"],
        message: "Enter a valid time out.",
      });
    }

    if (hasTimeOut && !hasTimeIn) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeOut"],
        message: "Time out cannot be saved without a time in.",
      });
    }

    if (isNonTimedAttendanceStatus(values.status) && (hasTimeIn || hasTimeOut)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Absent and unpaid day off records should not include time in or time out.",
      });
    }

    if (hasTimeIn && hasTimeOut) {
      const timeIn = parseLocalDateTime(values.timeIn);
      const timeOut = parseLocalDateTime(values.timeOut);

      if (timeIn && timeOut && timeOut <= timeIn) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["timeOut"],
          message: "Time out must be later than time in.",
        });
      }
    }
  });

export function parseAttendanceEntryFormData(formData: FormData): AttendanceFormValues {
  return {
    staffId: readString(formData, "staffId"),
    attendanceDate: readString(formData, "attendanceDate"),
    status: readString(formData, "status") as AttendanceFormValues["status"],
    timeIn: readString(formData, "timeIn"),
    timeOut: readString(formData, "timeOut"),
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isValidLocalDateTime(value: string) {
  return parseLocalDateTime(value) !== null;
}

function parseLocalDateTime(value: string) {
  const parsed = DateTime.fromFormat(value, LOCAL_DATE_TIME_FORMAT, {
    zone: BUSINESS_TIMEZONE,
  });

  return parsed.isValid ? parsed : null;
}
