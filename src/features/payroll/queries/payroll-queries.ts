import { notFound } from "next/navigation";

import type { StaffScheduleSummary } from "@/features/attendance/types";
import { computeExpectedWorkdaySummary } from "@/features/attendance/utils";
import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type {
  CompensationProfileSummary,
  PayrollCompensationRosterItem,
  PayrollPageData,
  PayrollPageFilters,
  PayrollPeriodDetailData,
  PayrollPeriodDetailSummary,
  PayrollPeriodStaffSummary,
  PayrollPeriodSummary,
} from "@/features/payroll/types";
import {
  isBlockedPayrollStaffSummary,
  resolvePayrollReadinessStatus,
  summarizePayrollAttendance,
} from "@/features/payroll/utils";
import type { TableRow } from "@/types/database";

type StaffRow = Pick<
  TableRow<"staff">,
  "id" | "first_name" | "last_name" | "role" | "contact_number" | "status"
>;
type CompensationRow = TableRow<"staff_compensation_profiles">;
type PayrollPeriodRow = TableRow<"payroll_periods">;
type StaffScheduleRow = TableRow<"staff_schedules">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type AttendanceRow = Pick<
  TableRow<"attendance">,
  "staff_id" | "status" | "time_in" | "time_out" | "approved_at" | "attendance_date"
>;

export async function getPayrollPageData(filters: PayrollPageFilters): Promise<PayrollPageData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("payroll:read");
  const [{ data: staffData, error: staffError }, { data: periodData, error: periodError }] =
    await Promise.all([
      applyBranchFilter(
        supabase
          .from("staff")
          .select("id, first_name, last_name, role, contact_number, status")
          .eq("status", "active")
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true }),
        branchScope.selectedBranchId,
      ),
      applyBranchFilter(
        supabase
          .from("payroll_periods")
          .select("*")
          .order("period_start_date", { ascending: false })
          .order("created_at", { ascending: false }),
        branchScope.selectedBranchId,
      ),
    ]);

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (periodError) {
    throw new Error(periodError.message);
  }

  const staffRows = (staffData ?? []) as StaffRow[];
  const staffIds = staffRows.map((staffMember) => staffMember.id);
  let compensationRows: CompensationRow[] = [];
  let scheduleRows: StaffScheduleRow[] = [];

  if (staffIds.length > 0) {
    const [{ data: compensationData, error: compensationError }, { data: scheduleData, error: scheduleError }] =
      await Promise.all([
        supabase.from("staff_compensation_profiles").select("*").in("staff_id", staffIds),
        supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
      ]);

    if (compensationError) {
      throw new Error(compensationError.message);
    }

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }

    compensationRows = (compensationData ?? []) as CompensationRow[];
    scheduleRows = (scheduleData ?? []) as StaffScheduleRow[];
  }

  const compensationByStaffId = new Map(
    compensationRows.map((row) => [row.staff_id, mapCompensationProfile(row)]),
  );
  const scheduleByStaffId = new Map(
    scheduleRows.map((row) => [row.staff_id, mapStaffSchedule(row)]),
  );
  const payrollPeriods = ((periodData ?? []) as PayrollPeriodRow[]).map(mapPayrollPeriod);
  const periodSearch = filters.periodSearch.trim().toLowerCase();
  const filteredPeriods = payrollPeriods.filter((period) => {
    if (filters.periodStatus && period.status !== filters.periodStatus) {
      return false;
    }

    if (!periodSearch) {
      return true;
    }

    return [period.label, period.notes ?? "", period.periodStartDate, period.periodEndDate, period.payoutDate]
      .join(" ")
      .toLowerCase()
      .includes(periodSearch);
  });
  const compensationRosterBase = staffRows.map<PayrollCompensationRosterItem>((staffMember) => ({
    staffId: staffMember.id,
    fullName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
    role: staffMember.role,
    contactNumber: staffMember.contact_number,
    schedule: scheduleByStaffId.get(staffMember.id) ?? null,
    profile: compensationByStaffId.get(staffMember.id) ?? null,
  }));
  const compensationSearch = filters.staffSearch.trim().toLowerCase();
  const filteredCompensationRoster = compensationSearch
    ? compensationRosterBase.filter((item) => {
        const haystacks = [item.fullName, item.contactNumber ?? "", item.role.replaceAll("_", " ")];
        return haystacks.some((value) => value.toLowerCase().includes(compensationSearch));
      })
    : compensationRosterBase;

  return {
    filters,
    summary: {
      activeStaffCount: staffRows.length,
      compensatedStaffCount: compensationRows.length,
      missingCompensationCount: Math.max(staffRows.length - compensationRows.length, 0),
      scheduledStaffCount: scheduleRows.length,
      missingScheduleCount: Math.max(staffRows.length - scheduleRows.length, 0),
      payrollPeriodCount: payrollPeriods.length,
      draftPeriodCount: payrollPeriods.filter((period) => period.status === "draft").length,
      processingPeriodCount: payrollPeriods.filter((period) => period.status === "processing").length,
      finalizedPeriodCount: payrollPeriods.filter((period) => period.status === "finalized").length,
    },
    payrollPeriods: filteredPeriods,
    compensationRoster: filteredCompensationRoster,
    totalCompensationRosterCount: compensationRosterBase.length,
    visibleCompensationRosterCount: filteredCompensationRoster.length,
  };
}

export async function getPayrollPeriodDetailData(periodId: string): Promise<PayrollPeriodDetailData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("payroll:read");
  const { data: periodData, error: periodError } = await applyBranchFilter(
    supabase.from("payroll_periods").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", periodId)
    .maybeSingle();

  if (periodError) {
    throw new Error(periodError.message);
  }

  if (!periodData) {
    notFound();
  }

  const period = mapPayrollPeriod(periodData as PayrollPeriodRow);
  const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .select("id, first_name, last_name, role, contact_number, status")
    .eq("branch_id", period.branchId)
    .eq("status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (staffError) {
    throw new Error(staffError.message);
  }

  const staffRows = (staffData ?? []) as StaffRow[];
  const staffIds = staffRows.map((staffMember) => staffMember.id);
  let compensationRows: CompensationRow[] = [];
  let scheduleRows: StaffScheduleRow[] = [];
  let attendanceRows: AttendanceRow[] = [];
  let holidayRows: BranchHolidayRow[] = [];
  let leaveEntryRows: StaffLeaveEntryRow[] = [];

  if (staffIds.length > 0) {
    const [
      { data: compensationData, error: compensationError },
      { data: scheduleData, error: scheduleError },
      { data: attendanceData, error: attendanceError },
      { data: holidayData, error: holidayError },
      { data: leaveEntryData, error: leaveEntryError },
    ] =
      await Promise.all([
        supabase.from("staff_compensation_profiles").select("*").in("staff_id", staffIds),
        supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
        supabase
          .from("attendance")
          .select("staff_id, status, time_in, time_out, approved_at, attendance_date")
          .gte("attendance_date", period.periodStartDate)
          .lte("attendance_date", period.periodEndDate)
          .in("staff_id", staffIds),
        supabase
          .from("branch_holidays")
          .select("*")
          .eq("branch_id", period.branchId)
          .gte("holiday_date", period.periodStartDate)
          .lte("holiday_date", period.periodEndDate),
        supabase
          .from("staff_leave_entries")
          .select("*")
          .eq("branch_id", period.branchId)
          .lte("start_date", period.periodEndDate)
          .gte("end_date", period.periodStartDate)
          .in("staff_id", staffIds),
      ]);

      if (compensationError) {
        throw new Error(compensationError.message);
      }

      if (scheduleError) {
        throw new Error(scheduleError.message);
      }

      if (attendanceError) {
        throw new Error(attendanceError.message);
      }

      if (holidayError) {
        throw new Error(holidayError.message);
      }

      if (leaveEntryError) {
        throw new Error(leaveEntryError.message);
      }

      compensationRows = (compensationData ?? []) as CompensationRow[];
      scheduleRows = (scheduleData ?? []) as StaffScheduleRow[];
      attendanceRows = (attendanceData ?? []) as AttendanceRow[];
      holidayRows = (holidayData ?? []) as BranchHolidayRow[];
      leaveEntryRows = (leaveEntryData ?? []) as StaffLeaveEntryRow[];
  }

  const compensationByStaffId = new Map(
    compensationRows.map((row) => [row.staff_id, mapCompensationProfile(row)]),
  );
  const scheduleByStaffId = new Map(
    scheduleRows.map((row) => [row.staff_id, mapStaffSchedule(row)]),
  );
  const attendanceByStaffId = new Map<string, AttendanceRow[]>();
  const leaveEntriesByStaffId = new Map<string, StaffLeaveEntryRow[]>();
  const holidayDates = new Set(holidayRows.map((row) => row.holiday_date));

  for (const row of attendanceRows) {
    const existing = attendanceByStaffId.get(row.staff_id) ?? [];
    existing.push(row);
    attendanceByStaffId.set(row.staff_id, existing);
  }

  for (const row of leaveEntryRows) {
    const existing = leaveEntriesByStaffId.get(row.staff_id) ?? [];
    existing.push(row);
    leaveEntriesByStaffId.set(row.staff_id, existing);
  }

  const staffSummaries = staffRows
    .map<PayrollPeriodStaffSummary>((staffMember) => {
      const schedule = scheduleByStaffId.get(staffMember.id) ?? null;
      const attendanceSummary = summarizePayrollAttendance(
        (attendanceByStaffId.get(staffMember.id) ?? []).map((record) => ({
          attendanceDate: record.attendance_date,
          status: record.status,
          timeIn: record.time_in,
          timeOut: record.time_out,
          approvedAt: record.approved_at,
        })),
        {
          ignoredMissingTimeoutDates: holidayDates,
        },
      );
      const compensationProfile = compensationByStaffId.get(staffMember.id) ?? null;
      const hadAttendanceActivity = attendanceSummary.recordedDays > 0;
      const expectationSummary = computeExpectedWorkdaySummary({
        schedule,
        startDate: period.periodStartDate,
        endDate: period.periodEndDate,
        holidayDates,
        leaveEntries: (leaveEntriesByStaffId.get(staffMember.id) ?? []).map((leaveEntry) => ({
          startDate: leaveEntry.start_date,
          endDate: leaveEntry.end_date,
        })),
      });
      const missingAttendanceDayCount = Math.max(
        expectationSummary.expectedWorkdayCount - attendanceSummary.recordedDays,
        0,
      );
      const readinessStatus = resolvePayrollReadinessStatus({
        hasCompensationProfile: compensationProfile !== null,
        hasSchedule: schedule !== null,
        expectedWorkdayCount: expectationSummary.expectedWorkdayCount,
        hadAttendanceActivity,
        missingAttendanceDayCount,
        missingTimeoutCount: attendanceSummary.missingTimeoutCount,
      });
      const summary: PayrollPeriodStaffSummary = {
        staffId: staffMember.id,
        fullName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
        role: staffMember.role,
        contactNumber: staffMember.contact_number,
        schedule,
        compensationProfile,
        hadAttendanceActivity,
        isBlocked: false,
        readinessStatus,
        scheduledWorkdayCount: expectationSummary.scheduledWorkdayCount,
        holidayDayCount: expectationSummary.holidayDayCount,
        approvedLeaveDayCount: expectationSummary.approvedLeaveDayCount,
        expectedWorkdayCount: expectationSummary.expectedWorkdayCount,
        missingAttendanceDayCount,
        recordedDays: attendanceSummary.recordedDays,
        presentCount: attendanceSummary.presentCount,
        lateCount: attendanceSummary.lateCount,
        halfDayCount: attendanceSummary.halfDayCount,
        absentCount: attendanceSummary.absentCount,
        missingTimeoutCount: attendanceSummary.missingTimeoutCount,
        approvedCount: attendanceSummary.approvedCount,
        pendingApprovalCount: attendanceSummary.pendingApprovalCount,
        workedMinutes: attendanceSummary.workedMinutes,
      };

      return {
        ...summary,
        isBlocked: isBlockedPayrollStaffSummary(summary),
      };
    })
    .sort((leftItem, rightItem) => {
      if (leftItem.isBlocked !== rightItem.isBlocked) {
        return leftItem.isBlocked ? -1 : 1;
      }

      if (leftItem.hadAttendanceActivity !== rightItem.hadAttendanceActivity) {
        return leftItem.hadAttendanceActivity ? -1 : 1;
      }

      return leftItem.fullName.localeCompare(rightItem.fullName);
    });

  const summary = staffSummaries.reduce<PayrollPeriodDetailSummary>(
    (currentSummary, staffSummary) => {
      currentSummary.totalStaffCount += 1;

      if (staffSummary.compensationProfile) {
        currentSummary.configuredStaffCount += 1;
      }

      if (staffSummary.schedule) {
        currentSummary.scheduledStaffCount += 1;
      }

      if (staffSummary.hadAttendanceActivity) {
        currentSummary.staffWithActivityCount += 1;
      }

      if (staffSummary.readinessStatus === "ready") {
        currentSummary.readyStaffCount += 1;
      }

      if (staffSummary.readinessStatus === "missing_compensation") {
        currentSummary.missingCompensationCount += 1;
      }

      if (staffSummary.readinessStatus === "missing_schedule") {
        currentSummary.missingScheduleCount += 1;
      }

      if (staffSummary.readinessStatus === "missing_attendance") {
        currentSummary.missingAttendanceCount += 1;
      }

      if (staffSummary.missingTimeoutCount > 0) {
        currentSummary.openShiftCount += 1;
      }

      currentSummary.pendingApprovalCount += staffSummary.pendingApprovalCount;

      if (staffSummary.isBlocked) {
        currentSummary.blockedStaffCount += 1;
      }

      currentSummary.totalWorkedMinutes += staffSummary.workedMinutes;

      return currentSummary;
    },
    {
      totalStaffCount: 0,
      staffWithActivityCount: 0,
      configuredStaffCount: 0,
      scheduledStaffCount: 0,
      readyStaffCount: 0,
      blockedStaffCount: 0,
      missingScheduleCount: 0,
      missingCompensationCount: 0,
      missingAttendanceCount: 0,
      openShiftCount: 0,
      pendingApprovalCount: 0,
      totalWorkedMinutes: 0,
    },
  );

  return {
    period,
    summary,
    staffSummaries,
  };
}

function mapCompensationProfile(row: CompensationRow): CompensationProfileSummary {
  return {
    id: row.id,
    staffId: row.staff_id,
    payBasis: row.pay_basis,
    baseRate: row.base_rate,
    overtimeRate: row.overtime_rate,
    allowancePerPeriod: row.allowance_per_period,
    effectiveStartDate: row.effective_start_date,
    notes: row.notes,
  };
}

function mapPayrollPeriod(row: PayrollPeriodRow): PayrollPeriodSummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    label: row.label,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    payoutDate: row.payout_date,
    status: row.status,
    notes: row.notes,
    createdByStaffId: row.created_by_staff_id,
    finalizedByStaffId: row.finalized_by_staff_id,
    finalizedAt: row.finalized_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStaffSchedule(row: StaffScheduleRow): StaffScheduleSummary {
  return {
    id: row.id,
    staffId: row.staff_id,
    shiftStartTime: row.shift_start_time,
    shiftEndTime: row.shift_end_time,
    graceMinutes: row.grace_minutes,
    mondayIsWorkday: row.monday_is_workday,
    tuesdayIsWorkday: row.tuesday_is_workday,
    wednesdayIsWorkday: row.wednesday_is_workday,
    thursdayIsWorkday: row.thursday_is_workday,
    fridayIsWorkday: row.friday_is_workday,
    saturdayIsWorkday: row.saturday_is_workday,
    sundayIsWorkday: row.sunday_is_workday,
    notes: row.notes,
  };
}
