import { z } from "zod";

import type {
  DtrAmendmentFormValues,
  DtrAmendmentReviewFormValues,
} from "@/features/attendance/types";

const amendmentTypeSchema = z.enum([
  "missed_time_in",
  "missed_time_out",
  "wrong_time",
  "shop_network_issue",
  "other",
]);

const targetLogTypeSchema = z.enum(["time_in", "time_out"]);

export const dtrAmendmentFormSchema = z
  .object({
    attendanceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid attendance date."),
    targetLogType: targetLogTypeSchema,
    amendmentType: amendmentTypeSchema,
    requestedTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Enter the requested time in HH:MM format."),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required.")
      .max(1000, "Reason must be 1000 characters or fewer."),
  })
  .superRefine((value, context) => {
    if (value.amendmentType === "missed_time_in" && value.targetLogType !== "time_in") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetLogType"],
        message: "Missed time in requests must target time in.",
      });
    }

    if (value.amendmentType === "missed_time_out" && value.targetLogType !== "time_out") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetLogType"],
        message: "Missed time out requests must target time out.",
      });
    }
  });

export const dtrAmendmentReviewSchema = z
  .object({
    amendmentId: z.string().uuid("Select a valid amendment request."),
    decision: z.enum(["approved", "rejected"]),
    finalTime: z.string().trim(),
    adminNote: z
      .string()
      .trim()
      .max(1000, "Admin note must be 1000 characters or fewer."),
  })
  .superRefine((value, context) => {
    if (value.decision === "approved" && !/^\d{2}:\d{2}$/.test(value.finalTime)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalTime"],
        message: "Enter the approved final time in HH:MM format.",
      });
    }
  });

export function parseDtrAmendmentFormData(formData: FormData): DtrAmendmentFormValues {
  return {
    attendanceDate: readString(formData, "attendanceDate"),
    targetLogType: readString(formData, "targetLogType") as DtrAmendmentFormValues["targetLogType"],
    amendmentType: readString(formData, "amendmentType") as DtrAmendmentFormValues["amendmentType"],
    requestedTime: readString(formData, "requestedTime"),
    reason: readString(formData, "reason"),
  };
}

export function parseDtrAmendmentReviewFormData(
  formData: FormData,
): DtrAmendmentReviewFormValues & { decision: "approved" | "rejected" } {
  return {
    amendmentId: readString(formData, "amendmentId"),
    decision: readString(formData, "decision") as "approved" | "rejected",
    finalTime: readString(formData, "finalTime"),
    adminNote: readString(formData, "adminNote"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
