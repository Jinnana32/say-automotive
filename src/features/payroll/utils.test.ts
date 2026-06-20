import { describe, expect, it } from "vitest";

import type {
  PayrollPeriodItemBreakdownDay,
  PayrollPeriodItemSummary,
} from "@/features/payroll/types";
import {
  buildPayrollRecordedVsPaidExplanation,
  buildPayrollWarningDetails,
  getPayrollAttendedDayCount,
  resolvePayrollReadinessStatus,
  summarizePayrollAttendance,
} from "@/features/payroll/utils";

describe("summarizePayrollAttendance", () => {
  it("counts attendance states, worked minutes, and missing time-outs", () => {
    const result = summarizePayrollAttendance([
      {
        attendanceDate: "2026-05-01",
        status: "present",
        timeIn: "2026-05-01T00:00:00.000Z",
        timeOut: "2026-05-01T09:00:00.000Z",
        approvedAt: "2026-05-01T10:00:00.000Z",
      },
      {
        attendanceDate: "2026-05-02",
        status: "late",
        timeIn: "2026-05-02T01:00:00.000Z",
        timeOut: null,
        approvedAt: null,
      },
      {
        attendanceDate: "2026-05-03",
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
    expect(result.approvedCount).toBe(3);
    expect(result.pendingApprovalCount).toBe(0);
    expect(result.workedMinutes).toBe(540);
  });

  it("ignores missing time-outs on branch holiday dates", () => {
    const result = summarizePayrollAttendance(
      [
        {
          attendanceDate: "2026-05-02",
          status: "late",
          timeIn: "2026-05-02T01:00:00.000Z",
          timeOut: null,
          approvedAt: null,
        },
      ],
      {
        ignoredMissingTimeoutDates: new Set(["2026-05-02"]),
      },
    );

    expect(result.recordedDays).toBe(1);
    expect(result.missingTimeoutCount).toBe(0);
    expect(result.approvedCount).toBe(1);
    expect(result.pendingApprovalCount).toBe(0);
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

describe("getPayrollAttendedDayCount", () => {
  it("counts late and half-day entries as attended days", () => {
    expect(
      getPayrollAttendedDayCount({
        presentCount: 6,
        lateCount: 2,
        halfDayCount: 1,
      }),
    ).toBe(9);
  });
});

const baseBreakdownDay: PayrollPeriodItemBreakdownDay = {
  date: "2026-05-01",
  weekdayLabel: "Fri",
  attendanceStatus: "present",
  statusLabel: "Present",
  timeIn: "2026-05-01T00:00:00.000Z",
  timeOut: "2026-05-01T08:00:00.000Z",
  workedMinutes: 480,
  regularMinutes: 480,
  overtimeMinutes: 0,
  lateDeductionMinutes: 0,
  paidDayUnits: 1,
  isPaid: true,
  payReason: "Complete attendance",
  warningCodes: [],
  holidayLabel: null,
  holidayKind: null,
  holidayPayTreatment: null,
  hasAttendanceRecord: true,
  hasPendingApproval: false,
  isScheduledWorkday: true,
  isLeaveCovered: false,
  leaveType: null,
  isApprovedLeavePaidDay: false,
  approvedLeavePay: 0,
  isWorkedDuringApprovedLeave: false,
  workedDuringApprovedLeavePremiumPay: 0,
  isRestDay: false,
};

const baseItem: Pick<
  PayrollPeriodItemSummary,
  "fullName" | "recordedDayCount" | "paidDayUnits" | "warningCodes"
> = {
  fullName: "Joselito Saclote",
  recordedDayCount: 2,
  paidDayUnits: 1,
  warningCodes: ["missing_attendance"],
};

describe("buildPayrollRecordedVsPaidExplanation", () => {
  it("explains when a recorded date is not counted as paid", () => {
    const explanation = buildPayrollRecordedVsPaidExplanation({
      item: baseItem,
      days: [
        baseBreakdownDay,
        {
          ...baseBreakdownDay,
          date: "2026-05-02",
          weekdayLabel: "Sat",
          attendanceStatus: "absent",
          statusLabel: "Absent",
          timeIn: null,
          timeOut: null,
          workedMinutes: 0,
          regularMinutes: 0,
          isPaid: false,
          paidDayUnits: 0,
          payReason: "Recorded absent day · not paid",
        },
      ],
    });

    expect(explanation).toContain("1 paid day");
    expect(explanation).toContain("Some dates were not paid");
  });

  it("mentions leave premium when a worked date overlaps approved leave", () => {
    const explanation = buildPayrollRecordedVsPaidExplanation({
      item: {
        ...baseItem,
        recordedDayCount: 1,
        paidDayUnits: 1,
      },
      days: [
        {
          ...baseBreakdownDay,
          statusLabel: "Worked During Approved Leave",
          payReason:
            "Approved leave exists, but staff also worked. Company policy applied leave premium.",
          isLeaveCovered: true,
          isWorkedDuringApprovedLeave: true,
          workedDuringApprovedLeavePremiumPay: 500,
          warningCodes: ["worked_during_approved_leave"],
        },
      ],
    });

    expect(explanation).toContain("company leave premium was added");
  });

  it("describes approved leave days paid without attendance logs", () => {
    const explanation = buildPayrollRecordedVsPaidExplanation({
      item: {
        ...baseItem,
        recordedDayCount: 0,
        paidDayUnits: 1,
      },
      days: [
        {
          ...baseBreakdownDay,
          hasAttendanceRecord: false,
          attendanceStatus: null,
          statusLabel: "Approved Leave",
          timeIn: null,
          timeOut: null,
          workedMinutes: 0,
          regularMinutes: 0,
          isPaid: true,
          payReason: "Approved paid leave on a scheduled working day.",
          isLeaveCovered: true,
          leaveType: "vacation",
          isApprovedLeavePaidDay: true,
          approvedLeavePay: 500,
          paidDayUnits: 1,
        },
      ],
    });

    expect(explanation).toContain("approved leave date was paid as scheduled working day");
  });
});

describe("buildPayrollWarningDetails", () => {
  it("returns specific warning dates and general configuration issues", () => {
    const warnings = buildPayrollWarningDetails({
      item: {
        ...baseItem,
        warningCodes: ["missing_attendance", "missing_compensation"],
      },
      days: [
        {
          ...baseBreakdownDay,
          date: "2026-05-03",
          weekdayLabel: "Sun",
          attendanceStatus: null,
          statusLabel: "No Record",
          leaveType: null,
          isApprovedLeavePaidDay: false,
          approvedLeavePay: 0,
          timeIn: null,
          timeOut: null,
          workedMinutes: 0,
          regularMinutes: 0,
          isPaid: false,
          paidDayUnits: 0,
          payReason: "No attendance record",
          warningCodes: ["missing_attendance"],
          hasAttendanceRecord: false,
        },
      ],
    });

    expect(warnings).toEqual([
      {
        date: "2026-05-03",
        label: "Missing attendance",
        reason: "Scheduled workday has no attendance record.",
      },
      {
        date: null,
        label: "Missing compensation",
        reason: "No compensation profile is configured for this staff member.",
      },
    ]);
  });

  it("returns worked-during-leave warnings with the specific date", () => {
    const warnings = buildPayrollWarningDetails({
      item: {
        ...baseItem,
        warningCodes: ["worked_during_approved_leave"],
      },
      days: [
        {
          ...baseBreakdownDay,
          date: "2026-05-04",
          statusLabel: "Worked During Approved Leave",
          payReason:
            "Approved leave exists, but staff also worked. Company policy applied leave premium.",
          isLeaveCovered: true,
          isWorkedDuringApprovedLeave: true,
          workedDuringApprovedLeavePremiumPay: 500,
          warningCodes: ["worked_during_approved_leave"],
        },
      ],
    });

    expect(warnings).toEqual([
      {
        date: "2026-05-04",
        label: "Worked during approved leave",
        reason:
          "Approved leave exists on this date, but the staff member also worked so the leave premium was applied.",
      },
    ]);
  });
});
