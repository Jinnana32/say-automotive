import { DateTime } from "luxon";

import { parseStaffScheduleTime } from "@/features/attendance/schedule-time-utils";
import type {
  BranchHolidayKind,
  BranchHolidayPayTreatment,
  StaffLeaveEntrySummary,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import {
  computeExpectedWorkdaySummary,
  doesLeaveCoverDate,
  isScheduledWorkdayForDate,
} from "@/features/attendance/utils";
import type {
  CompensationProfileSummary,
  PayrollAttendanceSourceRecord,
  PayrollPeriodItemAdjustmentSummary,
  PayrollStaffReadinessStatus,
  PayrollWarningCode,
} from "@/features/payroll/types";
import {
  resolvePayrollReadinessStatus,
  summarizePayrollAttendance,
} from "@/features/payroll/utils";
import type { StaffRole } from "@/lib/auth/permissions";
import { fromUtcIso } from "@/lib/dates";

const BUSINESS_TIMEZONE = "Asia/Manila";

export type PayrollRuleSettings = {
  standardDailyHours: number;
  holidayPremiumRate: number;
};

export type PayrollHolidayRule = {
  holidayDate: string;
  holidayKind: BranchHolidayKind;
  payTreatment: BranchHolidayPayTreatment;
};

export type PayrollComputedItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  payBasis: CompensationProfileSummary["payBasis"] | null;
  baseRate: number | null;
  overtimeRate: number | null;
  allowancePerPeriod: number;
  dailyRateUsed: number;
  hourlyRateUsed: number;
  standardDailyHours: number;
  holidayPremiumRate: number;
  scheduledWorkdayCount: number;
  holidayDayCount: number;
  approvedLeaveDayCount: number;
  expectedWorkdayCount: number;
  missingAttendanceDayCount: number;
  recordedDayCount: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  pendingApprovalCount: number;
  workedMinutes: number;
  paidDayUnits: number;
  holidayWorkedDayUnits: number;
  lateDeductionMinutes: number;
  overtimeMinutes: number;
  basePay: number;
  lateDeductionAmount: number;
  holidayPremiumPay: number;
  overtimePay: number;
  allowancePay: number;
  computedPay: number;
  manualAdditionsTotal: number;
  manualDeductionsTotal: number;
  grossPay: number;
  netPay: number;
  readinessStatus: PayrollStaffReadinessStatus;
  warningCodes: PayrollWarningCode[];
};

export function summarizeAdjustmentTotals(
  adjustments: PayrollPeriodItemAdjustmentSummary[],
) {
  return adjustments.reduce(
    (summary, adjustment) => {
      if (adjustment.adjustmentType === "addition") {
        summary.manualAdditionsTotal += adjustment.amount;
      } else {
        summary.manualDeductionsTotal += adjustment.amount;
      }

      return summary;
    },
    {
      manualAdditionsTotal: 0,
      manualDeductionsTotal: 0,
    },
  );
}

export function computePayrollItem(params: {
  staffId: string;
  fullName: string;
  role: StaffRole;
  schedule: StaffScheduleSummary | null;
  compensationProfile: CompensationProfileSummary | null;
  attendanceRecords: PayrollAttendanceSourceRecord[];
  holidays: PayrollHolidayRule[];
  leaveEntries: Array<Pick<StaffLeaveEntrySummary, "startDate" | "endDate">>;
  periodStartDate: string;
  periodEndDate: string;
  settings: PayrollRuleSettings;
  manualAdditionsTotal?: number;
  manualDeductionsTotal?: number;
}): PayrollComputedItem {
  const standardDailyHours = normalizeStandardDailyHours(
    params.settings.standardDailyHours,
  );
  const holidayPremiumRate = normalizeHolidayPremiumRate(
    params.settings.holidayPremiumRate,
  );
  const holidayDates = new Set(params.holidays.map((holiday) => holiday.holidayDate));
  const attendanceSummary = summarizePayrollAttendance(params.attendanceRecords, {
    ignoredMissingTimeoutDates: holidayDates,
  });
  const expectationSummary = computeExpectedWorkdaySummary({
    schedule: params.schedule,
    startDate: params.periodStartDate,
    endDate: params.periodEndDate,
    holidayDates,
    leaveEntries: params.leaveEntries,
  });
  const missingAttendanceDayCount = Math.max(
    expectationSummary.expectedWorkdayCount - attendanceSummary.recordedDays,
    0,
  );
  const readinessStatus = resolvePayrollReadinessStatus({
    hasCompensationProfile: params.compensationProfile !== null,
    hasSchedule: params.schedule !== null,
    expectedWorkdayCount: expectationSummary.expectedWorkdayCount,
    hadAttendanceActivity: attendanceSummary.recordedDays > 0,
    missingAttendanceDayCount,
    missingTimeoutCount: attendanceSummary.missingTimeoutCount,
  });
  const rateSummary = resolveCompensationRates({
    profile: params.compensationProfile,
    scheduledWorkdayCount: expectationSummary.scheduledWorkdayCount,
    standardDailyHours,
  });
  const attendanceByDate = new Map(
    params.attendanceRecords.map((record) => [record.attendanceDate, record]),
  );
  const holidayByDate = new Map(
    params.holidays.map((holiday) => [holiday.holidayDate, holiday]),
  );
  const warningCodes = new Set<PayrollWarningCode>(
    getWarningCodesForReadinessStatus(readinessStatus),
  );

  let paidDayUnits = 0;
  let holidayWorkedDayUnits = 0;
  let lateDeductionMinutes = 0;
  let overtimeMinutes = 0;

  for (const date of buildDateRange(params.periodStartDate, params.periodEndDate)) {
    const attendance = attendanceByDate.get(date);
    const holiday = holidayByDate.get(date);
    const leaveCovered = params.leaveEntries.some((leaveEntry) =>
      doesLeaveCoverDate(leaveEntry, date),
    );
    const scheduledWorkday = isScheduledWorkdayForDate(params.schedule, date);

    if (attendance) {
      const dayUnits = getAttendanceDayUnits(attendance.status);
      paidDayUnits += dayUnits;

      if (holiday && holiday.holidayKind !== "branch_closure" && dayUnits > 0) {
        holidayWorkedDayUnits += dayUnits;
      }

      if (attendance.status === "late") {
        lateDeductionMinutes += computeLateDeductionMinutes({
          schedule: params.schedule,
          attendanceDate: attendance.attendanceDate,
          timeIn: attendance.timeIn,
        });
      }

      overtimeMinutes += computeOvertimeMinutes({
        schedule: params.schedule,
        attendanceDate: attendance.attendanceDate,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
      });
    } else if (
      scheduledWorkday &&
      !leaveCovered &&
      holiday?.payTreatment === "paid_regular_day"
    ) {
      paidDayUnits += 1;
    }

    if (holiday?.payTreatment === "custom") {
      warningCodes.add("custom_holiday_rule");
    }
  }

  const basePay = roundMoney(rateSummary.dailyRateUsed * paidDayUnits);
  const lateDeductionAmount = roundMoney(
    (rateSummary.dailyRateUsed / (standardDailyHours * 60)) * lateDeductionMinutes,
  );
  const holidayPremiumPay = roundMoney(
    rateSummary.dailyRateUsed * holidayWorkedDayUnits * holidayPremiumRate,
  );
  const overtimePay = roundMoney(
    (overtimeMinutes / 60) * rateSummary.hourlyRateUsed,
  );
  const allowancePay = roundMoney(params.compensationProfile?.allowancePerPeriod ?? 0);
  const computedPay = roundMoney(
    basePay - lateDeductionAmount + holidayPremiumPay + overtimePay + allowancePay,
  );
  const manualAdditionsTotal = roundMoney(params.manualAdditionsTotal ?? 0);
  const manualDeductionsTotal = roundMoney(params.manualDeductionsTotal ?? 0);
  const grossPay = roundMoney(computedPay + manualAdditionsTotal);
  const netPay = roundMoney(grossPay - manualDeductionsTotal);

  if (attendanceSummary.pendingApprovalCount > 0) {
    warningCodes.add("pending_approval");
  }

  return {
    staffId: params.staffId,
    fullName: params.fullName,
    role: params.role,
    payBasis: params.compensationProfile?.payBasis ?? null,
    baseRate: params.compensationProfile?.baseRate ?? null,
    overtimeRate: params.compensationProfile?.overtimeRate ?? null,
    allowancePerPeriod: params.compensationProfile?.allowancePerPeriod ?? 0,
    dailyRateUsed: rateSummary.dailyRateUsed,
    hourlyRateUsed: rateSummary.hourlyRateUsed,
    standardDailyHours,
    holidayPremiumRate,
    scheduledWorkdayCount: expectationSummary.scheduledWorkdayCount,
    holidayDayCount: expectationSummary.holidayDayCount,
    approvedLeaveDayCount: expectationSummary.approvedLeaveDayCount,
    expectedWorkdayCount: expectationSummary.expectedWorkdayCount,
    missingAttendanceDayCount,
    recordedDayCount: attendanceSummary.recordedDays,
    presentCount: attendanceSummary.presentCount,
    lateCount: attendanceSummary.lateCount,
    halfDayCount: attendanceSummary.halfDayCount,
    absentCount: attendanceSummary.absentCount,
    missingTimeoutCount: attendanceSummary.missingTimeoutCount,
    pendingApprovalCount: attendanceSummary.pendingApprovalCount,
    workedMinutes: attendanceSummary.workedMinutes,
    paidDayUnits: roundMoney(paidDayUnits),
    holidayWorkedDayUnits: roundMoney(holidayWorkedDayUnits),
    lateDeductionMinutes,
    overtimeMinutes,
    basePay,
    lateDeductionAmount,
    holidayPremiumPay,
    overtimePay,
    allowancePay,
    computedPay,
    manualAdditionsTotal,
    manualDeductionsTotal,
    grossPay,
    netPay,
    readinessStatus,
    warningCodes: Array.from(warningCodes),
  };
}

function resolveCompensationRates(params: {
  profile: CompensationProfileSummary | null;
  scheduledWorkdayCount: number;
  standardDailyHours: number;
}) {
  if (!params.profile) {
    return {
      dailyRateUsed: 0,
      hourlyRateUsed: 0,
    };
  }

  const baseRate = params.profile.baseRate;
  let dailyRateUsed = 0;

  switch (params.profile.payBasis) {
    case "daily":
      dailyRateUsed = baseRate;
      break;
    case "hourly":
      dailyRateUsed = baseRate * params.standardDailyHours;
      break;
    case "monthly":
      dailyRateUsed =
        params.scheduledWorkdayCount > 0
          ? baseRate / params.scheduledWorkdayCount
          : 0;
      break;
  }

  const hourlyRateUsed =
    params.profile.overtimeRate && params.profile.overtimeRate > 0
      ? params.profile.overtimeRate
      : dailyRateUsed / params.standardDailyHours;

  return {
    dailyRateUsed: roundMoney(dailyRateUsed),
    hourlyRateUsed: roundMoney(hourlyRateUsed),
  };
}

function getWarningCodesForReadinessStatus(
  readinessStatus: PayrollStaffReadinessStatus,
): PayrollWarningCode[] {
  switch (readinessStatus) {
    case "missing_schedule":
      return ["missing_schedule"];
    case "missing_compensation":
      return ["missing_compensation"];
    case "missing_attendance":
      return ["missing_attendance"];
    case "needs_dtr_completion":
      return ["needs_dtr_completion"];
    case "not_configured":
      return ["not_configured"];
    default:
      return [];
  }
}

function getAttendanceDayUnits(
  status: PayrollAttendanceSourceRecord["status"],
) {
  switch (status) {
    case "present":
    case "late":
      return 1;
    case "half_day":
      return 0.5;
    case "absent":
      return 0;
  }
}

function computeLateDeductionMinutes(params: {
  schedule: StaffScheduleSummary | null;
  attendanceDate: string;
  timeIn: string | null;
}) {
  if (!params.schedule || !params.timeIn) {
    return 0;
  }

  const localizedTimeIn = fromUtcIso(params.timeIn);
  const shiftStart = resolveScheduleDateTime(
    params.schedule.shiftStartTime,
    params.attendanceDate,
  );

  if (!localizedTimeIn.isValid || !shiftStart.isValid) {
    return 0;
  }

  const deductibleStart = shiftStart.plus({ minutes: params.schedule.graceMinutes });

  if (localizedTimeIn <= deductibleStart) {
    return 0;
  }

  return Math.max(
    Math.round(localizedTimeIn.diff(deductibleStart, "minutes").minutes),
    0,
  );
}

function computeOvertimeMinutes(params: {
  schedule: StaffScheduleSummary | null;
  attendanceDate: string;
  timeIn: string | null;
  timeOut: string | null;
}) {
  if (!params.schedule || !params.timeIn || !params.timeOut) {
    return 0;
  }

  const localizedTimeIn = fromUtcIso(params.timeIn);
  const localizedTimeOut = fromUtcIso(params.timeOut);
  const shiftStart = resolveScheduleDateTime(
    params.schedule.shiftStartTime,
    params.attendanceDate,
  );
  let shiftEnd = resolveScheduleDateTime(
    params.schedule.shiftEndTime,
    params.attendanceDate,
  );

  if (!localizedTimeIn.isValid || !localizedTimeOut.isValid || !shiftStart.isValid || !shiftEnd.isValid) {
    return 0;
  }

  if (shiftEnd <= shiftStart) {
    shiftEnd = shiftEnd.plus({ days: 1 });
  }

  if (localizedTimeOut <= localizedTimeIn) {
    return 0;
  }

  const workedMinutes = Math.round(localizedTimeOut.diff(localizedTimeIn, "minutes").minutes);
  const scheduledMinutes = Math.round(shiftEnd.diff(shiftStart, "minutes").minutes);

  return Math.max(workedMinutes - scheduledMinutes, 0);
}

function resolveScheduleDateTime(timeValue: string, attendanceDate: string) {
  const parsedTime = parseStaffScheduleTime(timeValue);

  if (!parsedTime) {
    return DateTime.invalid("Invalid schedule time");
  }

  return DateTime.fromISO(attendanceDate, { zone: BUSINESS_TIMEZONE }).set({
    hour: parsedTime.hour,
    minute: parsedTime.minute,
    second: parsedTime.second,
    millisecond: 0,
  });
}

function buildDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  let cursor = DateTime.fromISO(startDate, { zone: BUSINESS_TIMEZONE }).startOf("day");
  const end = DateTime.fromISO(endDate, { zone: BUSINESS_TIMEZONE }).startOf("day");

  while (cursor.isValid && end.isValid && cursor <= end) {
    dates.push(cursor.toFormat("yyyy-LL-dd"));
    cursor = cursor.plus({ days: 1 });
  }

  return dates;
}

function normalizeStandardDailyHours(value: number) {
  return value > 0 ? value : 8;
}

function normalizeHolidayPremiumRate(value: number) {
  return value >= 0 ? value : 0.3;
}

function roundMoney(value: number) {
  return Number(value.toFixed(4));
}
