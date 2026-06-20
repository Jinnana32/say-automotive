import { describe, expect, it } from "vitest";

import {
  computePayrollItem,
  computePayrollItemBreakdown,
  summarizeAdjustmentTotals,
} from "@/features/payroll/calculations";
import type {
  CompensationProfileSummary,
  PayrollPeriodItemAdjustmentSummary,
} from "@/features/payroll/types";
import type { StaffScheduleSummary } from "@/features/attendance/types";

const baseSchedule: StaffScheduleSummary = {
  id: "schedule-1",
  staffId: "staff-1",
  shiftStartTime: "08:00:00",
  shiftEndTime: "16:00:00",
  graceMinutes: 10,
  mondayIsWorkday: true,
  tuesdayIsWorkday: true,
  wednesdayIsWorkday: true,
  thursdayIsWorkday: true,
  fridayIsWorkday: true,
  saturdayIsWorkday: false,
  sundayIsWorkday: false,
  notes: null,
};

const dailyProfile: CompensationProfileSummary = {
  id: "comp-1",
  staffId: "staff-1",
  payBasis: "daily",
  baseRate: 800,
  overtimeRate: null,
  allowancePerPeriod: 0,
  effectiveStartDate: "2026-01-01",
  notes: null,
};

describe("summarizeAdjustmentTotals", () => {
  it("separates manual additions from deductions", () => {
    const adjustments: PayrollPeriodItemAdjustmentSummary[] = [
      {
        id: "adj-1",
        payrollPeriodItemId: "item-1",
        adjustmentType: "addition",
        label: "Bonus",
        amount: 250,
        notes: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "adj-2",
        payrollPeriodItemId: "item-1",
        adjustmentType: "deduction",
        label: "SSS",
        amount: 100,
        notes: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z",
      },
    ];

    expect(summarizeAdjustmentTotals(adjustments)).toEqual({
      manualAdditionsTotal: 250,
      manualDeductionsTotal: 100,
    });
  });
});

describe("computePayrollItem", () => {
  it("computes base pay, late deductions, holiday premium, overtime, and manual adjustments", () => {
    const item = computePayrollItem({
      staffId: "staff-1",
      fullName: "Cyril Atizon",
      role: "mechanic",
      schedule: baseSchedule,
      compensationProfile: dailyProfile,
      attendanceRecords: [
        {
          attendanceDate: "2026-05-04",
          status: "present",
          timeIn: "2026-05-04T00:00:00.000Z",
          timeOut: "2026-05-04T08:00:00.000Z",
          approvedAt: "2026-05-04T09:00:00.000Z",
        },
        {
          attendanceDate: "2026-05-05",
          status: "late",
          timeIn: "2026-05-05T00:30:00.000Z",
          timeOut: "2026-05-05T08:00:00.000Z",
          approvedAt: "2026-05-05T09:00:00.000Z",
        },
        {
          attendanceDate: "2026-05-06",
          status: "present",
          timeIn: "2026-05-06T00:00:00.000Z",
          timeOut: "2026-05-06T09:00:00.000Z",
          approvedAt: "2026-05-06T10:00:00.000Z",
        },
      ],
      holidays: [
        {
          holidayDate: "2026-05-06",
          holidayKind: "public_holiday",
          payTreatment: "paid_regular_day",
        },
      ],
      leaveEntries: [],
      periodStartDate: "2026-05-04",
      periodEndDate: "2026-05-06",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
      manualAdditionsTotal: 100,
      manualDeductionsTotal: 50,
    });

    expect(item.paidDayUnits).toBe(3);
    expect(item.holidayWorkedDayUnits).toBe(1);
    expect(item.workedMinutes).toBe(1470);
    expect(item.lateDeductionMinutes).toBe(20);
    expect(item.overtimeMinutes).toBe(60);
    expect(item.basePay).toBe(2400);
    expect(item.lateDeductionAmount).toBe(33.3333);
    expect(item.holidayPremiumPay).toBe(240);
    expect(item.overtimePay).toBe(100);
    expect(item.computedPay).toBe(2706.6667);
    expect(item.grossPay).toBe(2806.6667);
    expect(item.netPay).toBe(2756.6667);
    expect(item.warningCodes).toEqual([]);
  });

  it("treats half days as literal 0.5 paid day without requiring a separate approval step", () => {
    const item = computePayrollItem({
      staffId: "staff-1",
      fullName: "Nenita Say",
      role: "admin",
      schedule: baseSchedule,
      compensationProfile: dailyProfile,
      attendanceRecords: [
        {
          attendanceDate: "2026-05-04",
          status: "half_day",
          timeIn: "2026-05-04T00:00:00.000Z",
          timeOut: "2026-05-04T04:00:00.000Z",
          approvedAt: null,
        },
      ],
      holidays: [],
      leaveEntries: [],
      periodStartDate: "2026-05-04",
      periodEndDate: "2026-05-04",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
    });

    expect(item.paidDayUnits).toBe(0.5);
    expect(item.basePay).toBe(400);
    expect(item.pendingApprovalCount).toBe(0);
    expect(item.warningCodes).not.toContain("pending_approval");
  });

  it("returns a daily breakdown with holiday labels and unpaid absence reasons", () => {
    const breakdown = computePayrollItemBreakdown({
      staffId: "staff-1",
      fullName: "Cyril Atizon",
      role: "mechanic",
      schedule: baseSchedule,
      compensationProfile: dailyProfile,
      attendanceRecords: [
        {
          attendanceDate: "2026-05-05",
          status: "absent",
          timeIn: null,
          timeOut: null,
          approvedAt: "2026-05-05T10:00:00.000Z",
        },
      ],
      holidays: [
        {
          holidayDate: "2026-05-04",
          label: "Shop maintenance",
          holidayKind: "branch_closure",
          payTreatment: "unpaid",
        },
      ],
      leaveEntries: [],
      periodStartDate: "2026-05-04",
      periodEndDate: "2026-05-05",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
    });

    expect(breakdown.days).toEqual([
      expect.objectContaining({
        date: "2026-05-04",
        statusLabel: "Branch Closed",
        holidayLabel: "Shop maintenance",
        isPaid: false,
        payReason: "Unpaid branch closure",
      }),
      expect.objectContaining({
        date: "2026-05-05",
        statusLabel: "Absent",
        isPaid: false,
        payReason: "Recorded absent day · not paid",
      }),
    ]);
  });

  it("adds a leave premium when staff worked during approved leave", () => {
    const breakdown = computePayrollItemBreakdown({
      staffId: "staff-1",
      fullName: "Cyril Atizon",
      role: "mechanic",
      schedule: baseSchedule,
      compensationProfile: dailyProfile,
      attendanceRecords: [
        {
          attendanceDate: "2026-05-04",
          status: "present",
          timeIn: "2026-05-04T00:00:00.000Z",
          timeOut: "2026-05-04T08:00:00.000Z",
          approvedAt: "2026-05-04T09:00:00.000Z",
        },
      ],
      holidays: [],
      leaveEntries: [
        {
          startDate: "2026-05-04",
          endDate: "2026-05-04",
          leaveType: "vacation",
        },
      ],
      periodStartDate: "2026-05-04",
      periodEndDate: "2026-05-04",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
    });

    expect(breakdown.item.paidDayUnits).toBe(1);
    expect(breakdown.item.basePay).toBe(800);
    expect(breakdown.item.workedDuringLeaveDayCount).toBe(1);
    expect(breakdown.item.workedDuringLeavePremiumPay).toBe(800);
    expect(breakdown.item.computedPay).toBe(1600);
    expect(breakdown.item.grossPay).toBe(1600);
    expect(breakdown.item.netPay).toBe(1600);
    expect(breakdown.item.warningCodes).toContain("worked_during_approved_leave");
    expect(breakdown.days).toEqual([
      expect.objectContaining({
        date: "2026-05-04",
        statusLabel: "Worked During Approved Leave",
        isWorkedDuringApprovedLeave: true,
        workedDuringApprovedLeavePremiumPay: 800,
        payReason:
          "Approved leave exists, but staff also worked. Company policy applied leave premium.",
        warningCodes: ["worked_during_approved_leave"],
      }),
    ]);
  });

  it("pays approved leave on a scheduled workday even without attendance logs", () => {
    const breakdown = computePayrollItemBreakdown({
      staffId: "staff-1",
      fullName: "Tamayo",
      role: "mechanic",
      schedule: baseSchedule,
      compensationProfile: {
        ...dailyProfile,
        baseRate: 495,
      },
      attendanceRecords: [],
      holidays: [],
      leaveEntries: [
        {
          startDate: "2026-05-04",
          endDate: "2026-05-04",
          leaveType: "vacation",
        },
      ],
      periodStartDate: "2026-05-04",
      periodEndDate: "2026-05-04",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
    });

    expect(breakdown.item.paidDayUnits).toBe(1);
    expect(breakdown.item.basePay).toBe(495);
    expect(breakdown.item.approvedLeavePay).toBe(495);
    expect(breakdown.item.computedPay).toBe(495);
    expect(breakdown.item.netPay).toBe(495);
    expect(breakdown.days).toEqual([
      expect.objectContaining({
        date: "2026-05-04",
        statusLabel: "Approved Leave",
        isApprovedLeavePaidDay: true,
        approvedLeavePay: 495,
        isPaid: true,
        payReason: "Approved paid leave on a scheduled working day.",
      }),
    ]);
  });

  it("does not pay approved leave on rest days or unpaid leave types", () => {
    const breakdown = computePayrollItemBreakdown({
      staffId: "staff-1",
      fullName: "Tamayo",
      role: "mechanic",
      schedule: baseSchedule,
      compensationProfile: dailyProfile,
      attendanceRecords: [],
      holidays: [],
      leaveEntries: [
        {
          startDate: "2026-05-03",
          endDate: "2026-05-03",
          leaveType: "vacation",
        },
        {
          startDate: "2026-05-05",
          endDate: "2026-05-05",
          leaveType: "unpaid",
        },
      ],
      periodStartDate: "2026-05-03",
      periodEndDate: "2026-05-05",
      settings: {
        standardDailyHours: 8,
        holidayPremiumRate: 0.3,
      },
    });

    expect(breakdown.item.paidDayUnits).toBe(0);
    expect(breakdown.item.approvedLeavePay).toBe(0);
    expect(breakdown.days).toEqual([
      expect.objectContaining({
        date: "2026-05-03",
        statusLabel: "Approved Leave",
        isApprovedLeavePaidDay: false,
        isPaid: false,
        payReason: "Approved leave on a rest day / not counted as paid day",
      }),
      expect.objectContaining({
        date: "2026-05-04",
        statusLabel: "Absent",
      }),
      expect.objectContaining({
        date: "2026-05-05",
        statusLabel: "Approved Leave",
        isApprovedLeavePaidDay: false,
        isPaid: false,
        payReason: "Approved unpaid leave / not counted as paid day",
      }),
    ]);
  });
});
