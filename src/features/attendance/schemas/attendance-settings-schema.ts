import { z } from "zod";

import type {
  AttendanceAccessSettingsFormValues,
  AttendanceAllowedIpFormValues,
} from "@/features/attendance/types";
import { isPublicIpAddress } from "@/lib/network/request-ip";

export const attendanceAccessSettingsSchema = z.object({
  requireShopIpForMechanicAttendance: z.boolean(),
  allowDtrAmendments: z.boolean(),
  allowAttendanceAdminOverride: z.boolean(),
});

export const attendanceAllowedIpSchema = z.object({
  ipAddress: z
    .string()
    .trim()
    .refine(
      (value) => isPublicIpAddress(value),
      "Enter the shop's public internet IP address, not a local Wi-Fi IP like 192.168.x.x.",
    ),
  label: z.string().trim().max(120, "Label is too long."),
});

export function parseAttendanceAccessSettingsFormData(
  formData: FormData,
): AttendanceAccessSettingsFormValues {
  return {
    requireShopIpForMechanicAttendance: readCheckbox(
      formData,
      "requireShopIpForMechanicAttendance",
    ),
    allowDtrAmendments: readCheckbox(formData, "allowDtrAmendments"),
    allowAttendanceAdminOverride: readCheckbox(
      formData,
      "allowAttendanceAdminOverride",
    ),
  };
}

export function parseAttendanceAllowedIpFormData(
  formData: FormData,
): AttendanceAllowedIpFormValues {
  return {
    ipAddress: readString(formData, "ipAddress"),
    label: readString(formData, "label"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
