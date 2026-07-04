import { describe, expect, it } from "vitest";

import {
  calculateDistanceMeters,
  DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  isLocationReadingFresh,
  isPremiseVerificationPassed,
  isWithinGeofence,
  validateMechanicLocationReading,
} from "@/lib/geolocation/geofence";

describe("geofence utilities", () => {
  const shopCenter = {
    latitude: 14.5995,
    longitude: 120.9842,
  };

  it("calculates distance between two coordinates", () => {
    const nearbyPoint = {
      latitude: 14.6005,
      longitude: 120.9852,
    };

    const distance = calculateDistanceMeters(shopCenter, nearbyPoint);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(200);
  });

  it("accepts readings inside the configured radius", () => {
    const result = isWithinGeofence({
      point: {
        latitude: 14.5996,
        longitude: 120.9843,
      },
      geofence: {
        ...shopCenter,
        radiusMeters: DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
      },
      accuracyMeters: 20,
    });

    expect(result.isAllowed).toBe(true);
    expect(result.distanceMeters).not.toBeNull();
  });

  it("rejects readings outside the configured radius", () => {
    const result = isWithinGeofence({
      point: {
        latitude: 14.61,
        longitude: 121.0,
      },
      geofence: {
        ...shopCenter,
        radiusMeters: DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
      },
      accuracyMeters: 20,
    });

    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBe("outside_radius");
  });

  it("rejects stale location readings", () => {
    const result = validateMechanicLocationReading({
      reading: {
        latitude: 14.5996,
        longitude: 120.9843,
        accuracyMeters: 20,
        capturedAtMs: Date.now() - 120_000,
      },
      geofence: {
        ...shopCenter,
        radiusMeters: DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
      },
    });

    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBe("stale_reading");
  });

  it("requires at least one enabled premise guard", () => {
    expect(
      isPremiseVerificationPassed({
        requireShopIp: true,
        requireShopLocation: false,
        isIpAllowed: true,
        isLocationAllowed: false,
      }),
    ).toBe(true);

    expect(
      isPremiseVerificationPassed({
        requireShopIp: false,
        requireShopLocation: true,
        isIpAllowed: false,
        isLocationAllowed: true,
      }),
    ).toBe(true);

    expect(
      isPremiseVerificationPassed({
        requireShopIp: true,
        requireShopLocation: true,
        isIpAllowed: true,
        isLocationAllowed: false,
      }),
    ).toBe(false);
  });

  it("accepts fresh readings", () => {
    expect(isLocationReadingFresh(Date.now() - 30_000)).toBe(true);
    expect(isLocationReadingFresh(Date.now() - 120_000)).toBe(false);
  });
});
