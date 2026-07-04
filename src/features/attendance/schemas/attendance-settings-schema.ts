import { z } from "zod";

import type {
  AttendanceAccessSettingsFormValues,
  AttendanceAllowedIpFormValues,
} from "@/features/attendance/types";
import {
  DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  isValidCoordinate,
} from "@/lib/geolocation/geofence";
import { isPublicIpAddress } from "@/lib/network/request-ip";

const geofenceLatitudeSchema = z.preprocess(
  parseOptionalNumber,
  z
    .number()
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90.")
    .nullable(),
);

const geofenceLongitudeSchema = z.preprocess(
  parseOptionalNumber,
  z
    .number()
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180.")
    .nullable(),
);

export const attendanceAccessSettingsSchema = z
  .object({
    requireShopIpForMechanicAttendance: z.boolean(),
    requireShopLocationForMechanicAttendance: z.boolean(),
    allowDtrAmendments: z.boolean(),
    allowAttendanceAdminOverride: z.boolean(),
    geofenceLatitude: geofenceLatitudeSchema,
    geofenceLongitude: geofenceLongitudeSchema,
    geofenceRadiusMeters: z.coerce
      .number()
      .int("Radius must be a whole number of meters.")
      .min(
        MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS,
        `Radius must be at least ${MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS} meters.`,
      )
      .max(
        MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS,
        `Radius must be ${MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS} meters or less.`,
      ),
  })
  .superRefine((values, context) => {
    if (
      !values.requireShopIpForMechanicAttendance &&
      !values.requireShopLocationForMechanicAttendance
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requireShopIpForMechanicAttendance"],
        message:
          "Enable at least one on-site verification method: shop IP or shop location.",
      });
    }

    if (!values.requireShopLocationForMechanicAttendance) {
      return;
    }

    if (
      values.geofenceLatitude === null ||
      values.geofenceLongitude === null ||
      !isValidCoordinate(values.geofenceLatitude, values.geofenceLongitude)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceLatitude"],
        message: "Set the shop location on the map before enabling location verification.",
      });
    }
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
    requireShopLocationForMechanicAttendance: readCheckbox(
      formData,
      "requireShopLocationForMechanicAttendance",
    ),
    allowDtrAmendments: readCheckbox(formData, "allowDtrAmendments"),
    allowAttendanceAdminOverride: readCheckbox(
      formData,
      "allowAttendanceAdminOverride",
    ),
    geofenceLatitude: readString(formData, "geofenceLatitude"),
    geofenceLongitude: readString(formData, "geofenceLongitude"),
    geofenceRadiusMeters:
      readString(formData, "geofenceRadiusMeters") ||
      String(DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS),
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

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
