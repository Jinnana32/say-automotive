import { describe, expect, it } from "vitest";

import {
  buildAttendanceSummary,
  buildBranchHolidayFormValues,
  buildStaffScheduleFormValues,
  computeExpectedWorkdaySummary,
  isMechanicPortalPunchAllowed,
  matchesAttendanceStatusFilter,
} from "@/features/attendance/utils";

describe("computeExpectedWorkdaySummary", () => {
  it("subtracts branch holidays and approved leave from scheduled workdays without double counting", () => {
    const result = computeExpectedWorkdaySummary({
      schedule: {
        id: "schedule-1",
        staffId: "staff-1",
        shiftStartTime: "08:00:00",
        shiftEndTime: "17:00:00",
        graceMinutes: 10,
        mondayIsWorkday: true,
        tuesdayIsWorkday: true,
        wednesdayIsWorkday: true,
        thursdayIsWorkday: true,
        fridayIsWorkday: true,
        saturdayIsWorkday: false,
        sundayIsWorkday: false,
        notes: null,
      },
      startDate: "2026-05-04",
      endDate: "2026-05-08",
      holidayDates: ["2026-05-05", "2026-05-08"],
      leaveEntries: [
        {
          startDate: "2026-05-06",
          endDate: "2026-05-07",
        },
        {
          startDate: "2026-05-08",
          endDate: "2026-05-08",
        },
      ],
    });

    expect(result.scheduledWorkdayCount).toBe(5);
    expect(result.holidayDayCount).toBe(2);
    expect(result.approvedLeaveDayCount).toBe(2);
    expect(result.expectedWorkdayCount).toBe(1);
  });
});

describe("buildStaffScheduleFormValues", () => {
  it("normalizes stored schedule times for the time input fields", () => {
    const result = buildStaffScheduleFormValues("staff-1", {
      id: "schedule-1",
      staffId: "staff-1",
      shiftStartTime: "07:00:00",
      shiftEndTime: "17:00:00",
      graceMinutes: 0,
      mondayIsWorkday: true,
      tuesdayIsWorkday: true,
      wednesdayIsWorkday: true,
      thursdayIsWorkday: true,
      fridayIsWorkday: true,
      saturdayIsWorkday: true,
      sundayIsWorkday: false,
      notes: null,
    });

    expect(result.shiftStartTime).toBe("07:00");
    expect(result.shiftEndTime).toBe("17:00");
  });
});

describe("buildBranchHolidayFormValues", () => {
  it("defaults new branch calendar dates to branch closure and unpaid", () => {
    const result = buildBranchHolidayFormValues(null);

    expect(result.holidayKind).toBe("branch_closure");
    expect(result.payTreatment).toBe("unpaid");
  });
});

describe("attendance holiday handling", () => {
  const branchHoliday = {
    id: "holiday-1",
    branchId: "branch-1",
    holidayDate: "2026-05-16",
    label: "Shop maintenance",
    holidayKind: "branch_closure" as const,
    payTreatment: "unpaid" as const,
    notes: "Closed for maintenance",
  };

  it("does not count no-record staff as unrecorded on a branch closure date", () => {
    const result = buildAttendanceSummary(
      [
        {
          staffId: "staff-1",
          fullName: "Jane Doe",
          role: "mechanic",
          contactNumber: null,
          schedule: null,
          leaveEntry: null,
          attendance: null,
          hasMissingTimeout: false,
          isApproved: false,
        },
        {
          staffId: "staff-2",
          fullName: "John Doe",
          role: "mechanic",
          contactNumber: null,
          schedule: null,
          leaveEntry: null,
          attendance: {
            id: "attendance-1",
            attendanceDate: "2026-05-16",
            timeIn: "2026-05-16T00:00:00.000Z",
            timeOut: null,
            status: "present",
            notes: null,
            approvedByStaffId: null,
            approvedAt: null,
          },
          hasMissingTimeout: true,
          isApproved: false,
        },
      ],
      {
        branchHoliday,
      },
    );

    expect(result.unrecordedCount).toBe(0);
    expect(result.recordedCount).toBe(1);
    expect(result.missingTimeoutCount).toBe(0);
  });

  it("does not treat closure-day rows as unrecorded or missing-timeout filters", () => {
    const noAttendanceItem = {
      staffId: "staff-1",
      fullName: "Jane Doe",
      role: "mechanic" as const,
      contactNumber: null,
      schedule: null,
      leaveEntry: null,
      attendance: null,
      hasMissingTimeout: false,
      isApproved: false,
    };
    const openShiftItem = {
      ...noAttendanceItem,
      staffId: "staff-2",
      fullName: "John Doe",
      attendance: {
        id: "attendance-1",
        attendanceDate: "2026-05-16",
        timeIn: "2026-05-16T00:00:00.000Z",
        timeOut: null,
        status: "present" as const,
        notes: null,
        approvedByStaffId: null,
        approvedAt: null,
      },
      hasMissingTimeout: true,
    };

    expect(
      matchesAttendanceStatusFilter(noAttendanceItem, "unrecorded", { branchHoliday }),
    ).toBe(false);
    expect(
      matchesAttendanceStatusFilter(openShiftItem, "missing_timeout", { branchHoliday }),
    ).toBe(false);
  });
});

describe("mechanic portal punch verification", () => {
  const baseSettings = {
    requireShopIpForMechanicAttendance: true,
    requireShopLocationForMechanicAttendance: true,
    allowDtrAmendments: true,
    allowAttendanceAdminOverride: false,
    geofence: {
      latitude: 14.5995,
      longitude: 120.9842,
      radiusMeters: 100,
    },
  };

  const baseIpStatus = {
    requestIp: "::1",
    isShopIpRequired: true,
    isAllowed: false,
    matchedAllowedIp: null,
  };

  const baseLocationStatus = {
    isLocationRequired: true,
    isAllowed: true,
    latitude: 14.5995,
    longitude: 120.9842,
    accuracyMeters: 5,
    distanceMeters: 3,
    errorMessage: null,
  };

  it("allows punch when two of three checks pass", () => {
    expect(
      isMechanicPortalPunchAllowed({
        settings: baseSettings,
        ipStatus: baseIpStatus,
        locationStatus: baseLocationStatus,
        deviceApproved: true,
      }),
    ).toBe(true);
  });

  it("blocks punch when only one of three checks passes", () => {
    expect(
      isMechanicPortalPunchAllowed({
        settings: baseSettings,
        ipStatus: baseIpStatus,
        locationStatus: { ...baseLocationStatus, isAllowed: false },
        deviceApproved: true,
      }),
    ).toBe(false);
  });

  it("requires all checks when only two are enabled", () => {
    expect(
      isMechanicPortalPunchAllowed({
        settings: {
          ...baseSettings,
          requireShopLocationForMechanicAttendance: false,
        },
        ipStatus: { ...baseIpStatus, isAllowed: false },
        locationStatus: { ...baseLocationStatus, isAllowed: false },
        deviceApproved: true,
      }),
    ).toBe(false);

    expect(
      isMechanicPortalPunchAllowed({
        settings: {
          ...baseSettings,
          requireShopLocationForMechanicAttendance: false,
        },
        ipStatus: { ...baseIpStatus, isAllowed: true },
        locationStatus: { ...baseLocationStatus, isAllowed: false },
        deviceApproved: true,
      }),
    ).toBe(true);
  });
});
