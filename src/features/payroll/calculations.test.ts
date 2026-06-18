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
});
