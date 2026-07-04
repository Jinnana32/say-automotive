import { describe, expect, it } from "vitest";

import {
  attendanceAccessSettingsSchema,
  attendanceAllowedIpSchema,
} from "@/features/attendance/schemas/attendance-settings-schema";

describe("attendance settings schemas", () => {
  it("accepts boolean mechanic attendance settings", () => {
    const result = attendanceAccessSettingsSchema.safeParse({
      requireShopIpForMechanicAttendance: true,
      requireShopLocationForMechanicAttendance: false,
      allowDtrAmendments: true,
      allowAttendanceAdminOverride: false,
      geofenceLatitude: null,
      geofenceLongitude: null,
      geofenceRadiusMeters: 100,
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one on-site verification method", () => {
    const result = attendanceAccessSettingsSchema.safeParse({
      requireShopIpForMechanicAttendance: false,
      requireShopLocationForMechanicAttendance: false,
      allowDtrAmendments: true,
      allowAttendanceAdminOverride: false,
      geofenceLatitude: null,
      geofenceLongitude: null,
      geofenceRadiusMeters: 100,
    });

    expect(result.success).toBe(false);
  });

  it("requires a configured geofence when location verification is enabled", () => {
    const result = attendanceAccessSettingsSchema.safeParse({
      requireShopIpForMechanicAttendance: false,
      requireShopLocationForMechanicAttendance: true,
      allowDtrAmendments: true,
      allowAttendanceAdminOverride: false,
      geofenceLatitude: null,
      geofenceLongitude: null,
      geofenceRadiusMeters: 100,
    });

    expect(result.success).toBe(false);
  });

  it("validates allowed public IP entries", () => {
    expect(
      attendanceAllowedIpSchema.safeParse({
        ipAddress: "124.217.16.204",
        label: "Main line",
      }).success,
    ).toBe(true);

    expect(
      attendanceAllowedIpSchema.safeParse({
        ipAddress: "shop-network",
        label: "",
      }).success,
    ).toBe(false);

    expect(
      attendanceAllowedIpSchema.safeParse({
        ipAddress: "192.168.1.9",
        label: "Phone wifi address",
      }).success,
    ).toBe(false);
  });
});
