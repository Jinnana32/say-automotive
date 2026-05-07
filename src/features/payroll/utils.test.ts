import { describe, expect, it } from "vitest";

import { resolvePayrollReadinessStatus, summarizePayrollAttendance } from "@/features/payroll/utils";

describe("summarizePayrollAttendance", () => {
  it("counts attendance states, worked minutes, and missing time-outs", () => {
    const result = summarizePayrollAttendance([
      {
        status: "present",
        timeIn: "2026-05-01T00:00:00.000Z",
        timeOut: "2026-05-01T09:00:00.000Z",
        approvedAt: "2026-05-01T10:00:00.000Z",
      },
      {
        status: "late",
        timeIn: "2026-05-02T01:00:00.000Z",
        timeOut: null,
        approvedAt: null,
      },
      {
        status: "absent",
        timeIn: null,
        timeOut: null,
        approvedAt: null,
      },
    ]);

    expect(result.recordedDays).toBe(3);
    expect(result.presentCount).toBe(1);
    expect(result.lateCount).toBe(1);
    expect(result.absentCount).toBe(1);
    expect(result.missingTimeoutCount).toBe(1);
    expect(result.approvedCount).toBe(1);
    expect(result.pendingApprovalCount).toBe(2);
    expect(result.workedMinutes).toBe(540);
  });
});

describe("resolvePayrollReadinessStatus", () => {
  it("marks attendance activity without compensation as blocked", () => {
    const result = resolvePayrollReadinessStatus({
      hasCompensationProfile: false,
      hasSchedule: true,
      expectedWorkdayCount: 5,
      hadAttendanceActivity: true,
      missingAttendanceDayCount: 0,
      missingTimeoutCount: 0,
    });

    expect(result).toBe("missing_compensation");
  });

  it("marks configured staff with uncovered workdays as missing attendance", () => {
    const result = resolvePayrollReadinessStatus({
      hasCompensationProfile: true,
      hasSchedule: true,
      expectedWorkdayCount: 6,
      hadAttendanceActivity: true,
      missingAttendanceDayCount: 2,
      missingTimeoutCount: 0,
    });

    expect(result).toBe("missing_attendance");
  });

  it("treats zero expected workdays as configured with no activity instead of blocked", () => {
    const result = resolvePayrollReadinessStatus({
      hasCompensationProfile: true,
      hasSchedule: true,
      expectedWorkdayCount: 0,
      hadAttendanceActivity: false,
      missingAttendanceDayCount: 0,
      missingTimeoutCount: 0,
    });

    expect(result).toBe("configured_no_activity");
  });
});
