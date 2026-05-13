import { describe, expect, it } from "vitest";

import {
  attendanceAccessSettingsSchema,
  attendanceAllowedIpSchema,
} from "@/features/attendance/schemas/attendance-settings-schema";

describe("attendance settings schemas", () => {
  it("accepts boolean mechanic attendance settings", () => {
    const result = attendanceAccessSettingsSchema.safeParse({
      requireShopIpForMechanicAttendance: true,
      allowDtrAmendments: true,
      allowAttendanceAdminOverride: false,
    });

    expect(result.success).toBe(true);
  });

  it("validates allowed public IP entries", () => {
    expect(
      attendanceAllowedIpSchema.safeParse({
        ipAddress: "203.0.113.10",
        label: "Main line",
      }).success,
    ).toBe(true);

    expect(
      attendanceAllowedIpSchema.safeParse({
        ipAddress: "shop-network",
        label: "",
      }).success,
    ).toBe(false);
  });
});
