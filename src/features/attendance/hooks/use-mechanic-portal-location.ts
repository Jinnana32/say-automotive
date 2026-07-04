"use client";

import { useEffect, useState } from "react";

import type { AttendanceGeofenceSettings } from "@/features/attendance/types";
import {
  isWithinGeofence,
  MAX_MECHANIC_LOCATION_ACCURACY_METERS,
} from "@/lib/geolocation/geofence";

export type MechanicPortalLocationState = {
  isLoading: boolean;
  isAllowed: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  distanceMeters: number | null;
  capturedAtMs: number | null;
  errorMessage: string | null;
};

const INITIAL_STATE: MechanicPortalLocationState = {
  isLoading: false,
  isAllowed: false,
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  distanceMeters: null,
  capturedAtMs: null,
  errorMessage: null,
};

export function useMechanicPortalLocation({
  required,
  geofence,
}: {
  required: boolean;
  geofence: AttendanceGeofenceSettings;
}) {
  const [state, setState] = useState<MechanicPortalLocationState>({
    ...INITIAL_STATE,
    isLoading: required,
    errorMessage: required
      ? "Waiting for your current location. Allow location access in your browser."
      : null,
  });

  useEffect(() => {
    if (!required) {
      setState({
        ...INITIAL_STATE,
        isAllowed: true,
        errorMessage: null,
      });
      return;
    }

    if (
      geofence.latitude === null ||
      geofence.longitude === null
    ) {
      setState({
        ...INITIAL_STATE,
        errorMessage:
          "Shop location is not configured yet. Ask the admin to set the branch geofence.",
      });
      return;
    }

    if (!navigator.geolocation) {
      setState({
        ...INITIAL_STATE,
        errorMessage: "This browser does not support location access.",
      });
      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      isLoading: true,
      errorMessage: "Checking your current location...",
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return;
        }

        applyPosition(position);
      },
      (error) => {
        if (cancelled) {
          return;
        }

        setState({
          ...INITIAL_STATE,
          errorMessage:
            error.code === error.PERMISSION_DENIED
              ? "Location permission is required for on-site attendance. Allow location access in your browser."
              : "Unable to read your current location. Try again near the shop entrance.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      },
    );

    const refreshTimer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!cancelled) {
            applyPosition(position);
          }
        },
        () => undefined,
        {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        },
      );
    }, 45_000);

    function applyPosition(position: GeolocationPosition) {
      const validation = isWithinGeofence({
        point: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        geofence: {
          latitude: geofence.latitude ?? 0,
          longitude: geofence.longitude ?? 0,
          radiusMeters: geofence.radiusMeters,
        },
        accuracyMeters: position.coords.accuracy,
        maxAccuracyMeters: MAX_MECHANIC_LOCATION_ACCURACY_METERS,
      });

      setState({
        isLoading: false,
        isAllowed: validation.isAllowed,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        distanceMeters: validation.distanceMeters,
        capturedAtMs: position.timestamp,
        errorMessage: validation.isAllowed
          ? null
          : validation.reason === "accuracy_too_low"
            ? "Your location reading is too imprecise. Move closer to an open area and try again."
            : "You are outside the approved shop location.",
      });
    }

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [
    geofence.latitude,
    geofence.longitude,
    geofence.radiusMeters,
    required,
  ]);

  return state;
}
