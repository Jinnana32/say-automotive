import { z } from "zod";

import type { AttendanceAccessSettings } from "@/features/attendance/types";
import { validateMechanicLocationReading } from "@/lib/geolocation/geofence";

const mechanicLocationSubmissionSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracyMeters: z.coerce.number().min(0),
  capturedAtMs: z.coerce.number().int().positive(),
});

export function resolveMechanicLocationSubmission({
  settings,
  formData,
}: {
  settings: AttendanceAccessSettings;
  formData: FormData;
}) {
  if (!settings.requireShopLocationForMechanicAttendance) {
    return {
      isRequired: false,
      isAllowed: true,
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      distanceMeters: null,
      errorMessage: null,
    };
  }

  const parsed = mechanicLocationSubmissionSchema.safeParse({
    latitude: readString(formData, "locationLatitude"),
    longitude: readString(formData, "locationLongitude"),
    accuracyMeters: readString(formData, "locationAccuracyMeters"),
    capturedAtMs: readString(formData, "locationCapturedAtMs"),
  });

  if (!parsed.success) {
    return {
      isRequired: true,
      isAllowed: false,
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      distanceMeters: null,
      errorMessage:
        "Location is required for attendance. Allow browser location access and try again.",
    };
  }

  const validation = validateMechanicLocationReading({
    reading: parsed.data,
    geofence: {
      latitude: settings.geofence.latitude ?? 0,
      longitude: settings.geofence.longitude ?? 0,
      radiusMeters: settings.geofence.radiusMeters,
    },
  });

  if (validation.isAllowed) {
    return {
      isRequired: true,
      isAllowed: true,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracyMeters: parsed.data.accuracyMeters,
      distanceMeters: validation.distanceMeters,
      errorMessage: null,
    };
  }

  const errorMessage =
    validation.reason === "accuracy_too_low"
      ? "Your location reading is too imprecise. Move closer to an open area and try again."
      : validation.reason === "stale_reading"
        ? "Your location reading expired. Refresh the page and try again."
        : validation.reason === "geofence_not_configured"
          ? "Shop location is not configured yet. Ask the admin to set it up."
          : "You are not within the approved shop location. File a DTR amendment if this attendance needs admin review.";

  return {
    isRequired: true,
    isAllowed: false,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    accuracyMeters: parsed.data.accuracyMeters,
    distanceMeters: validation.distanceMeters,
    errorMessage,
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
