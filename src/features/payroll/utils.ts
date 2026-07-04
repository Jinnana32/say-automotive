import { DateTime } from "luxon";

import { countScheduledWorkdays } from "@/features/attendance/utils";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import { formatMoneyInputValue } from "@/lib/currency";
import { formatDate, getBusinessNow } from "@/lib/dates";
import type {
  CompensationProfileFormValues,
  CompensationProfileSummary,
  PayBasis,
  PayrollAttendanceSourceRecord,
  PayrollPeriodItemBreakdownDay,
  PayrollPeriodItemDifferenceDetail,
  PayrollPeriodItemSummary,
  PayrollPeriodItemWarningDetail,
  PayrollFormActionState,
  PayrollPageFilters,
  PayrollPeriodFormValues,
  PayrollPeriodStaffSummary,
  PayrollPeriodStatus,
  PayrollStaffReadinessStatus,
  PayrollWarningCode,
} from "@/features/payroll/types";

export const PAY_BASIS_OPTIONS: Array<{
  value: PayBasis;
  label: string;
}> = [
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
];

export const PAYROLL_PERIOD_STATUS_OPTIONS: Array<{
  value: PayrollPeriodStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "finalized", label: "Finalized" },
];

export const INITIAL_PAYROLL_FORM_ACTION_STATE: PayrollFormActionState = {
  status: "idle",
};

export function resolvePayrollPageFilters(params: {
  periodSearch?: string;
  staffSearch?: string;
  periodStatus?: string;
}): PayrollPageFilters {
  return {
    periodSearch: params.periodSearch?.trim() ?? "",
    staffSearch: params.staffSearch?.trim() ?? "",
    periodStatus: isPayrollPeriodStatus(params.periodStatus) ? params.periodStatus : "",
  };
}

export function formatPayBasisLabel(payBasis: PayBasis) {
  switch (payBasis) {
    case "monthly":
      return "Monthly";
    case "daily":
      return "Daily";
    case "hourly":
      return "Hourly";
  }
}

export function formatPayrollPeriodStatusLabel(status: PayrollPeriodStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "processing":
      return "Processing";
    case "finalized":
      return "Finalized";
  }
}

export function getPayrollPeriodStatusTone(status: PayrollPeriodStatus) {
  switch (status) {
    case "draft":
      return "neutral";
    case "processing":
      return "warning";
    case "finalized":
      return "success";
  }
}

export function formatPayrollCoverage(periodStartDate: string, periodEndDate: string) {
  return `${formatDate(periodStartDate)} to ${formatDate(periodEndDate)}`;
}

export function formatWorkedDuration(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0h";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatPayrollDayUnits(dayUnits: number) {
  const normalized = Number(dayUnits.toFixed(2));

  if (Number.isInteger(normalized)) {
    return String(normalized);
  }

  return normalized.toString();
}

export function getPayrollAttendedDayCount(params: {
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
}) {
  return params.presentCount + params.lateCount + params.halfDayCount;
}

export function formatPayrollReadinessLabel(status: PayrollStaffReadinessStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "missing_schedule":
      return "Missing schedule";
    case "missing_compensation":
      return "Missing compensation";
    case "missing_attendance":
      return "Missing attendance";
    case "needs_dtr_completion":
      return "Needs DTR completion";
    case "configured_no_activity":
      return "Configured";
    case "not_configured":
      return "Not configured";
  }
}

export function getPayrollReadinessTone(status: PayrollStaffReadinessStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "configured_no_activity":
      return "info";
    case "missing_schedule":
    case "missing_compensation":
    case "missing_attendance":
    case "needs_dtr_completion":
      return "warning";
    case "not_configured":
      return "neutral";
  }
}

export function formatPayrollWarningLabel(code: PayrollWarningCode) {
  switch (code) {
    case "missing_schedule":
      return "Missing schedule";
    case "missing_compensation":
      return "Missing compensation";
    case "missing_attendance":
      return "Missing attendance";
    case "needs_dtr_completion":
      return "Needs time out";
    case "not_configured":
      return "Not configured";
    case "pending_approval":
      return "Pending approval";
    case "custom_holiday_rule":
      return "Custom holiday rule";
    case "worked_during_approved_leave":
      return "Worked during approved leave";
  }
}

export function buildPayrollDifferenceDetails(
  days: PayrollPeriodItemBreakdownDay[],
): PayrollPeriodItemDifferenceDetail[] {
  return days.flatMap((day) => {
    const shouldExplainRecordedDifference = day.hasAttendanceRecord && day.paidDayUnits !== 1;
    const shouldExplainAutoPaidDay = !day.hasAttendanceRecord && day.paidDayUnits > 0;
    const shouldExplainScheduledUnpaidDay =
      !day.hasAttendanceRecord &&
      day.paidDayUnits === 0 &&
      (day.warningCodes.includes("missing_attendance") ||
        day.warningCodes.includes("custom_holiday_rule") ||
        day.holidayKind !== null ||
        day.isLeaveCovered);
    const shouldExplainWorkedDuringApprovedLeave = day.warningCodes.includes(
      "worked_during_approved_leave",
    );

    if (
      !shouldExplainRecordedDifference &&
      !shouldExplainAutoPaidDay &&
      !shouldExplainScheduledUnpaidDay &&
      !shouldExplainWorkedDuringApprovedLeave
    ) {
      return [];
    }

    return [
      {
        date: day.date,
        statusLabel: day.statusLabel,
        reason: day.payReason,
        paidDayUnits: day.paidDayUnits,
      },
    ];
  });
}

export function buildPayrollRecordedVsPaidExplanation(params: {
  item: Pick<PayrollPeriodItemSummary, "fullName" | "recordedDayCount" | "paidDayUnits">;
  days: PayrollPeriodItemBreakdownDay[];
}) {
  const paidLabel = formatPayrollDayUnits(params.item.paidDayUnits);
  const workedDuringLeaveDays = params.days.filter(
    (day) => day.isWorkedDuringApprovedLeave,
  ).length;
  const workedDuringLeaveNote =
    workedDuringLeaveDays > 0
      ? ` ${workedDuringLeaveDays} date${
          workedDuringLeaveDays === 1 ? " was" : "s were"
        } worked during approved leave, so the company leave premium was added on top of the normal worked-day pay.`
      : "";
  const fullyPaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits === 1,
  ).length;
  const partiallyPaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits > 0 && day.paidDayUnits < 1,
  ).length;
  const unpaidRecordedDays = params.days.filter(
    (day) => day.hasAttendanceRecord && day.paidDayUnits === 0,
  ).length;
  const autoPaidLeaveDays = params.days.filter(
    (day) => !day.hasAttendanceRecord && day.isApprovedLeavePaidDay,
  ).length;
  const autoPaidHolidayOrClosureDays = params.days.filter(
    (day) =>
      !day.hasAttendanceRecord && day.paidDayUnits > 0 && !day.isApprovedLeavePaidDay,
  ).length;

  if (params.item.recordedDayCount === params.item.paidDayUnits) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. This payroll uses paid attendance days, overtime, and manual adjustments for the selected coverage window.${workedDuringLeaveNote}`;
  }

  if (params.item.recordedDayCount > params.item.paidDayUnits) {
    if (unpaidRecordedDays > 0 && partiallyPaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were not fully paid: ${unpaidRecordedDays} date${
        unpaidRecordedDays === 1 ? " was" : "s were"
      } not paid, and ${partiallyPaidRecordedDays} date${
        partiallyPaidRecordedDays === 1 ? " was" : "s were"
      } only partially paid.${workedDuringLeaveNote}`;
    }

    if (unpaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were not paid because they were absent, missing required attendance, unpaid closure days, or otherwise not payable.${workedDuringLeaveNote}`;
    }

    if (partiallyPaidRecordedDays > 0) {
      return `${params.item.fullName} has ${paidLabel} paid day${
        params.item.paidDayUnits === 1 ? "" : "s"
      } in this payroll period. Some dates were only partially paid, such as half days or days with reduced payable time.${workedDuringLeaveNote}`;
    }
  }

  if (autoPaidLeaveDays > 0) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. ${autoPaidLeaveDays} approved leave date${
      autoPaidLeaveDays === 1 ? " was" : "s were"
    } paid as scheduled working day${autoPaidLeaveDays === 1 ? "" : "s"} without attendance logs.${workedDuringLeaveNote}`;
  }

  if (autoPaidHolidayOrClosureDays > 0) {
    return `${params.item.fullName} has ${paidLabel} paid day${
      params.item.paidDayUnits === 1 ? "" : "s"
    } in this payroll period. ${autoPaidHolidayOrClosureDays} date${
      autoPaidHolidayOrClosureDays === 1 ? " was" : "s were"
    } counted as paid without a punch record because of the configured holiday or closure treatment.${workedDuringLeaveNote}`;
  }

  return `${params.item.fullName} has ${paidLabel} paid day${
    params.item.paidDayUnits === 1 ? "" : "s"
  } in this payroll period. Use the daily breakdown and warnings below to review unpaid, partial, or exception dates.${workedDuringLeaveNote}`;
}

export function buildPayrollWarningDetails(params: {
  item: Pick<PayrollPeriodItemSummary, "warningCodes">;
  days: PayrollPeriodItemBreakdownDay[];
}): PayrollPeriodItemWarningDetail[] {
  const details = new Map<string, PayrollPeriodItemWarningDetail>();

  for (const day of params.days) {
    for (const warningCode of day.warningCodes) {
      const key = `${day.date}:${warningCode}`;
      details.set(key, {
        date: day.date,
        label: formatPayrollWarningLabel(warningCode),
        reason: resolvePayrollWarningReason(warningCode, day),
      });
    }
  }

  for (const warningCode of params.item.warningCodes) {
    const hasSpecificDay = params.days.some((day) => day.warningCodes.includes(warningCode));

    if (hasSpecificDay) {
      continue;
    }

    details.set(`general:${warningCode}`, {
      date: null,
      label: formatPayrollWarningLabel(warningCode),
      reason: resolvePayrollWarningReason(warningCode),
    });
  }

  return Array.from(details.values()).sort((left, right) => {
    if (left.date === right.date) {
      return left.label.localeCompare(right.label);
    }

    if (!left.date) {
      return 1;
    }

    if (!right.date) {
      return -1;
    }

    return left.date.localeCompare(right.date);
  });
}

export function buildCompensationProfileFormValues(
  staffId: string,
  profile: CompensationProfileSummary | null,
): CompensationProfileFormValues {
  return {
    staffId,
    payBasis: profile?.payBasis ?? "daily",
    baseRate: profile ? formatMoneyInputValue(profile.baseRate) : "",
    overtimeRate: profile?.overtimeRate ? formatMoneyInputValue(profile.overtimeRate) : "",
    allowancePerPeriod: profile ? formatMoneyInputValue(profile.allowancePerPeriod) : formatMoneyInputValue(0),
    effectiveStartDate: profile?.effectiveStartDate ?? getBusinessNow().toFormat("yyyy-LL-dd"),
    exemptFromAttendance: profile?.exemptFromAttendance ?? false,
    notes: profile?.notes ?? "",
  };
}

export function buildDefaultPayrollPeriodFormValues(): PayrollPeriodFormValues {
  const now = getBusinessNow();
  const startOfMonth = now.startOf("month").toFormat("yyyy-LL-dd");
  const endOfMonth = now.endOf("month").toFormat("yyyy-LL-dd");
  const monthLabel = now.toFormat("LLLL yyyy");

  return {
    label: `Payroll ${monthLabel}`,
    periodStartDate: startOfMonth,
    periodEndDate: endOfMonth,
    payoutDate: endOfMonth,
    notes: "",
  };
}

export function summarizePayrollAttendance(
  records: PayrollAttendanceSourceRecord[],
  options: {
    ignoredMissingTimeoutDates?: Set<string>;
  } = {},
) {
  return records.reduce(
    (summary, record) => {
      summary.recordedDays += 1;

      summary.approvedCount += 1;

      if (record.status === "present") {
        summary.presentCount += 1;
      }

      if (record.status === "late") {
        summary.lateCount += 1;
      }

      if (record.status === "half_day") {
        summary.halfDayCount += 1;
      }

      if (record.status === "absent") {
        summary.absentCount += 1;
      }

      if (
        record.timeIn &&
        !record.timeOut &&
        !options.ignoredMissingTimeoutDates?.has(record.attendanceDate)
      ) {
        summary.missingTimeoutCount += 1;
      }

      if (record.timeIn && record.timeOut) {
        const timeIn = DateTime.fromISO(record.timeIn, { zone: "utc" });
        const timeOut = DateTime.fromISO(record.timeOut, { zone: "utc" });

        if (timeIn.isValid && timeOut.isValid && timeOut > timeIn) {
          summary.workedMinutes += Math.round(timeOut.diff(timeIn, "minutes").minutes);
        }
      }

      return summary;
    },
    {
      recordedDays: 0,
      presentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
      absentCount: 0,
      missingTimeoutCount: 0,
      approvedCount: 0,
      pendingApprovalCount: 0,
      workedMinutes: 0,
    },
  );
}

export function resolvePayrollReadinessStatus({
  hasCompensationProfile,
  hasSchedule,
  expectedWorkdayCount,
  hadAttendanceActivity,
  missingAttendanceDayCount,
  missingTimeoutCount,
  exemptFromAttendance = false,
}: {
  hasCompensationProfile: boolean;
  hasSchedule: boolean;
  expectedWorkdayCount: number;
  hadAttendanceActivity: boolean;
  missingAttendanceDayCount: number;
  missingTimeoutCount: number;
  exemptFromAttendance?: boolean;
}): PayrollStaffReadinessStatus {
  if (!exemptFromAttendance && missingTimeoutCount > 0) {
    return "needs_dtr_completion";
  }

  if (hadAttendanceActivity && !hasCompensationProfile) {
    return "missing_compensation";
  }

  if (hasCompensationProfile && !hasSchedule) {
    return "missing_schedule";
  }

  if (!exemptFromAttendance && missingAttendanceDayCount > 0) {
    return "missing_attendance";
  }

  if (!hasCompensationProfile) {
    return "not_configured";
  }

  if (expectedWorkdayCount === 0 && !hadAttendanceActivity && !exemptFromAttendance) {
    return "configured_no_activity";
  }

  return "ready";
}

export function isBlockedPayrollStaffSummary(summary: Pick<
  PayrollPeriodStaffSummary,
  "readinessStatus"
>) {
  return (
    summary.readinessStatus === "missing_compensation" ||
    summary.readinessStatus === "missing_schedule" ||
    summary.readinessStatus === "missing_attendance" ||
    summary.readinessStatus === "needs_dtr_completion"
  );
}

export function computeScheduledWorkdayCountForPeriod(
  schedule: StaffScheduleSummary | null,
  periodStartDate: string,
  periodEndDate: string,
) {
  return countScheduledWorkdays(schedule, periodStartDate, periodEndDate);
}

function isPayrollPeriodStatus(value: string | undefined): value is PayrollPeriodStatus {
  return PAYROLL_PERIOD_STATUS_OPTIONS.some((option) => option.value === value);
}

function resolvePayrollWarningReason(
  code: PayrollWarningCode,
  day?: PayrollPeriodItemBreakdownDay,
) {
  switch (code) {
    case "missing_schedule":
      return "No work schedule is configured for this staff member.";
    case "missing_compensation":
      return "No compensation profile is configured for this staff member.";
    case "missing_attendance":
      return day?.holidayKind
        ? `${day.statusLabel} is not counted as paid and has no attendance record.`
        : "Scheduled workday has no attendance record.";
    case "needs_dtr_completion":
      return "Time out is missing for this attendance date.";
    case "not_configured":
      return "Payroll setup is incomplete for this staff member.";
    case "pending_approval":
      return "Attendance is still pending approval.";
    case "custom_holiday_rule":
      return day?.holidayLabel
        ? `${day.holidayLabel} uses a custom pay treatment and should be reviewed manually.`
        : "Holiday pay treatment is custom and should be reviewed manually.";
    case "worked_during_approved_leave":
      return "Approved leave exists on this date, but the staff member also worked so the leave premium was applied.";
  }
}
