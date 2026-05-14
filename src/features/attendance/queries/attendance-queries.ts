import { DateTime } from "luxon";

import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type { StaffRole } from "@/lib/auth/permissions";
import type {
  AttendanceCalendarMonthData,
  AttendanceDateLockSummary,
  BranchHolidaySummary,
  AttendanceRecordSummary,
  AttendanceRosterData,
  AttendanceRosterItem,
  AttendancePageFilters,
  StaffLeaveEntrySummary,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import {
  buildAttendanceSummary,
  doesLeaveCoverDate,
  getDefaultAttendanceDate,
  hasMissingTimeout,
  isAttendanceApproved,
  isScheduledWorkdayForDate,
  matchesAttendanceStatusFilter,
} from "@/features/attendance/utils";
import type { TableRow } from "@/types/database";

type StaffAttendanceRosterRow = Pick<
  TableRow<"staff">,
  "id" | "first_name" | "last_name" | "role" | "status" | "contact_number"
>;
type AttendanceRow = TableRow<"attendance">;
type StaffScheduleRow = TableRow<"staff_schedules">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type DtrAmendmentRow = Pick<
  TableRow<"dtr_amendment_requests">,
  "staff_id" | "attendance_date" | "status"
>;
type PayrollPeriodLockRow = Pick<
  TableRow<"payroll_periods">,
  "id" | "label" | "status"
>;

export async function getAttendanceRosterData(
  filters: AttendancePageFilters,
  options: {
    excludeRoles?: StaffRole[];
  } = {},
): Promise<AttendanceRosterData> {
  const { context, supabase } = await getAuthorizedSupabaseServerClient("attendance:read");
  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  let staffQuery = supabase
    .from("staff")
    .select("id, first_name, last_name, role, status, contact_number")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  for (const role of options.excludeRoles ?? []) {
    staffQuery = staffQuery.neq("role", role);
  }

  if (filters.role) {
    staffQuery = staffQuery.eq("role", filters.role);
  }

  if (filters.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    staffQuery = staffQuery.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%`,
    );
  }

  const { data: staffRows, error: staffError } = await staffQuery;

  if (staffError) {
    throw new Error(staffError.message);
  }

  const rosterStaff = (staffRows ?? []) as StaffAttendanceRosterRow[];
  const staffIds = rosterStaff.map((staffMember) => staffMember.id);
  let attendanceRows: AttendanceRow[] = [];
  let staffScheduleRows: StaffScheduleRow[] = [];
  let leaveEntryRows: StaffLeaveEntryRow[] = [];

  if (staffIds.length > 0) {
    const [
      { data: attendanceData, error: attendanceError },
      { data: scheduleData, error: scheduleError },
      { data: leaveEntryData, error: leaveEntryError },
    ] =
      await Promise.all([
        supabase.from("attendance").select("*").eq("attendance_date", filters.date).in("staff_id", staffIds),
        supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
        supabase
          .from("staff_leave_entries")
          .select("*")
          .eq("branch_id", branchId)
          .lte("start_date", filters.date)
          .gte("end_date", filters.date)
          .in("staff_id", staffIds),
      ]);

    if (attendanceError) {
      throw new Error(attendanceError.message);
    }

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }

    if (leaveEntryError) {
      throw new Error(leaveEntryError.message);
    }

    attendanceRows = (attendanceData ?? []) as AttendanceRow[];
    staffScheduleRows = (scheduleData ?? []) as StaffScheduleRow[];
    leaveEntryRows = (leaveEntryData ?? []) as StaffLeaveEntryRow[];
  }

  const [lockedPeriod, branchHoliday] = await Promise.all([
    getAttendanceDateLock(filters.date, supabase),
    getBranchHolidayForDate({
      attendanceDate: filters.date,
      branchId,
      supabase,
    }),
  ]);

  const attendanceByStaffId = new Map(
    attendanceRows.map((attendanceRow) => [attendanceRow.staff_id, mapAttendanceRecord(attendanceRow)]),
  );
  const scheduleByStaffId = new Map(
    staffScheduleRows.map((scheduleRow) => [scheduleRow.staff_id, mapStaffSchedule(scheduleRow)]),
  );
  const leaveEntryByStaffId = new Map(
    leaveEntryRows.map((leaveEntryRow) => [leaveEntryRow.staff_id, mapStaffLeaveEntry(leaveEntryRow)]),
  );
  const rosterBase = rosterStaff.map<AttendanceRosterItem>((staffMember) => {
    const attendance = attendanceByStaffId.get(staffMember.id) ?? null;

    return {
      staffId: staffMember.id,
      fullName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
      role: staffMember.role,
      contactNumber: staffMember.contact_number,
      schedule: scheduleByStaffId.get(staffMember.id) ?? null,
      leaveEntry: leaveEntryByStaffId.get(staffMember.id) ?? null,
      attendance,
      hasMissingTimeout: hasMissingTimeout(attendance),
      isApproved: isAttendanceApproved(attendance),
    };
  });
  const summary = buildAttendanceSummary(rosterBase);
  const filteredRoster = rosterBase.filter((item) =>
    matchesAttendanceStatusFilter(item, filters.status),
  );

  return {
    filters,
    branchHoliday,
    summary,
    roster: filteredRoster,
    totalMatchingStaff: rosterBase.length,
    visibleCount: filteredRoster.length,
    lockedPeriod,
  };
}

export async function getAttendanceCalendarMonthData({
  selectedDate,
  requestedMonth,
}: {
  selectedDate: string;
  requestedMonth?: string;
}): Promise<AttendanceCalendarMonthData> {
  const { context, supabase } = await getAuthorizedSupabaseServerClient("attendance:read");
  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  const targetMonth = resolveAttendanceCalendarMonth(selectedDate, requestedMonth);
  const monthStartDate = targetMonth.startOf("month").toFormat("yyyy-LL-dd");
  const monthEndDate = targetMonth.endOf("month").toFormat("yyyy-LL-dd");
  const todayDate = getDefaultAttendanceDate();

  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .select("id, first_name, last_name, role, status, contact_number")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .neq("role", "admin")
    .neq("role", "owner")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (staffError) {
    throw new Error(staffError.message);
  }

  const activeStaff = (staffRows ?? []) as StaffAttendanceRosterRow[];
  const staffIds = activeStaff.map((staffMember) => staffMember.id);
  let attendanceRows: AttendanceRow[] = [];
  let staffScheduleRows: StaffScheduleRow[] = [];
  let leaveEntryRows: StaffLeaveEntryRow[] = [];
  let amendmentRows: DtrAmendmentRow[] = [];

  const [{ data: holidayData, error: holidayError }] = await Promise.all([
    supabase
      .from("branch_holidays")
      .select("*")
      .eq("branch_id", branchId)
      .gte("holiday_date", monthStartDate)
      .lte("holiday_date", monthEndDate)
      .order("holiday_date", { ascending: true }),
  ]);

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  if (staffIds.length > 0) {
    const [
      { data: attendanceData, error: attendanceError },
      { data: scheduleData, error: scheduleError },
      { data: leaveData, error: leaveError },
      { data: amendmentData, error: amendmentError },
    ] = await Promise.all([
      supabase
        .from("attendance")
        .select("*")
        .gte("attendance_date", monthStartDate)
        .lte("attendance_date", monthEndDate)
        .in("staff_id", staffIds),
      supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
      supabase
        .from("staff_leave_entries")
        .select("*")
        .eq("branch_id", branchId)
        .lte("start_date", monthEndDate)
        .gte("end_date", monthStartDate)
        .in("staff_id", staffIds),
      supabase
        .from("dtr_amendment_requests")
        .select("staff_id, attendance_date, status")
        .eq("branch_id", branchId)
        .eq("status", "pending")
        .gte("attendance_date", monthStartDate)
        .lte("attendance_date", monthEndDate)
        .in("staff_id", staffIds),
    ]);

    if (attendanceError) {
      throw new Error(attendanceError.message);
    }

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }

    if (leaveError) {
      throw new Error(leaveError.message);
    }

    if (amendmentError) {
      throw new Error(amendmentError.message);
    }

    attendanceRows = (attendanceData ?? []) as AttendanceRow[];
    staffScheduleRows = (scheduleData ?? []) as StaffScheduleRow[];
    leaveEntryRows = (leaveData ?? []) as StaffLeaveEntryRow[];
    amendmentRows = (amendmentData ?? []) as DtrAmendmentRow[];
  }

  const attendanceByStaffDate = new Map(
    attendanceRows.map((row) => [buildAttendanceCalendarKey(row.staff_id, row.attendance_date), mapAttendanceRecord(row)]),
  );
  const scheduleByStaffId = new Map(
    staffScheduleRows.map((row) => [row.staff_id, mapStaffSchedule(row)]),
  );
  const leaveEntriesByStaffId = new Map<string, StaffLeaveEntrySummary[]>();
  const pendingAmendmentsByStaffDate = new Map<string, number>();
  const holidayDateSet = new Set(
    ((holidayData ?? []) as BranchHolidayRow[]).map((row) => row.holiday_date),
  );

  for (const leaveRow of leaveEntryRows) {
    const mapped = mapStaffLeaveEntry(leaveRow);
    const current = leaveEntriesByStaffId.get(mapped.staffId) ?? [];
    current.push(mapped);
    leaveEntriesByStaffId.set(mapped.staffId, current);
  }

  for (const amendmentRow of amendmentRows) {
    const key = buildAttendanceCalendarKey(
      amendmentRow.staff_id,
      amendmentRow.attendance_date,
    );
    pendingAmendmentsByStaffDate.set(key, (pendingAmendmentsByStaffDate.get(key) ?? 0) + 1);
  }

  const days: AttendanceCalendarMonthData["days"] = [];
  let cursor = targetMonth.startOf("month");
  const monthEnd = targetMonth.endOf("month").startOf("day");

  while (cursor <= monthEnd) {
    const date = cursor.toFormat("yyyy-LL-dd");
    const isFuture = date > todayDate;
    const isBranchHoliday = holidayDateSet.has(date);
    let staffCount = 0;
    let recordedCount = 0;
    let approvedCount = 0;
    let attentionCount = 0;
    let absentCount = 0;

    for (const staffMember of activeStaff) {
      const schedule = scheduleByStaffId.get(staffMember.id) ?? null;
      const leaveEntries = leaveEntriesByStaffId.get(staffMember.id) ?? [];
      const leaveEntry = leaveEntries.find((entry) => doesLeaveCoverDate(entry, date)) ?? null;
      const attendance =
        attendanceByStaffDate.get(buildAttendanceCalendarKey(staffMember.id, date)) ?? null;
      const hasPendingAmendment =
        (pendingAmendmentsByStaffDate.get(buildAttendanceCalendarKey(staffMember.id, date)) ?? 0) > 0;
      const isScheduledWorkday =
        !isFuture &&
        !isBranchHoliday &&
        leaveEntry === null &&
        isScheduledWorkdayForDate(schedule, date);
      const isIncomplete =
        hasPendingAmendment ||
        Boolean(attendance?.timeOut === null && attendance?.timeIn);
      const isAbsent =
        isScheduledWorkday &&
        (!attendance || attendance.status === "absent");
      const shouldInclude = isScheduledWorkday || attendance !== null || hasPendingAmendment;

      if (!shouldInclude) {
        continue;
      }

      staffCount += 1;

      if (attendance && attendance.status !== "absent") {
        recordedCount += 1;

        if (isAttendanceApproved(attendance)) {
          approvedCount += 1;
        }
      }

      if (isIncomplete) {
        attentionCount += 1;
        continue;
      }

      if (isAbsent) {
        absentCount += 1;
      }
    }

    days.push({
      date,
      status: deriveAttendanceCalendarStatus({
        isFuture,
        recordedCount,
        attentionCount,
        absentCount,
      }),
      staffCount,
      recordedCount,
      approvedCount,
      attentionCount,
      absentCount,
    });

    cursor = cursor.plus({ days: 1 });
  }

  const normalizedSelectedDate = DateTime.fromISO(selectedDate);
  const selectedDateValue =
    normalizedSelectedDate.isValid && normalizedSelectedDate.hasSame(targetMonth, "month")
      ? normalizedSelectedDate.toFormat("yyyy-LL-dd")
      : monthStartDate;

  return {
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate,
    monthEndDate,
    selectedDate: selectedDateValue,
    days,
  };
}

function mapAttendanceRecord(row: AttendanceRow): AttendanceRecordSummary {
  return {
    id: row.id,
    attendanceDate: row.attendance_date,
    timeIn: row.time_in,
    timeOut: row.time_out,
    status: row.status,
    notes: row.notes,
    approvedByStaffId: row.approved_by_staff_id,
    approvedAt: row.approved_at,
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

function mapBranchHoliday(row: BranchHolidayRow): BranchHolidaySummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    holidayDate: row.holiday_date,
    label: row.label,
    holidayKind: row.holiday_kind as BranchHolidaySummary["holidayKind"],
    notes: row.notes,
  };
}

function mapStaffLeaveEntry(row: StaffLeaveEntryRow): StaffLeaveEntrySummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    staffId: row.staff_id,
    startDate: row.start_date,
    endDate: row.end_date,
    leaveType: row.leave_type as StaffLeaveEntrySummary["leaveType"],
    notes: row.notes,
  };
}

function deriveAttendanceCalendarStatus({
  isFuture,
  recordedCount,
  attentionCount,
  absentCount,
}: {
  isFuture: boolean;
  recordedCount: number;
  attentionCount: number;
  absentCount: number;
}) {
  if (isFuture) {
    return "none" as const;
  }

  if (attentionCount > 0) {
    return "attention" as const;
  }

  if (absentCount > 0) {
    return "absent" as const;
  }

  if (recordedCount > 0) {
    return "complete" as const;
  }

  return "none" as const;
}

async function getAttendanceDateLock(
  attendanceDate: string,
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
): Promise<AttendanceDateLockSummary | null> {
  const { data, error } = await supabase
    .from("payroll_periods")
    .select("id, label, status")
    .in("status", ["processing", "finalized"])
    .lte("period_start_date", attendanceDate)
    .gte("period_end_date", attendanceDate)
    .order("period_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const period = data as PayrollPeriodLockRow;

  return {
    payrollPeriodId: period.id,
    payrollPeriodLabel: period.label,
    payrollPeriodStatus: period.status,
  };
}

async function getBranchHolidayForDate({
  attendanceDate,
  branchId,
  supabase,
}: {
  attendanceDate: string;
  branchId: string;
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"];
}) {
  const { data, error } = await supabase
    .from("branch_holidays")
    .select("*")
    .eq("branch_id", branchId)
    .eq("holiday_date", attendanceDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapBranchHoliday(data as BranchHolidayRow) : null;
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function resolveAttendanceCalendarMonth(selectedDate: string, requestedMonth?: string) {
  const defaultDate = DateTime.fromISO(getDefaultAttendanceDate());
  const selectedDateValue = DateTime.fromISO(selectedDate);
  const selectedMonth = selectedDateValue.isValid ? selectedDateValue.startOf("month") : defaultDate.startOf("month");
  const requestedMonthValue = requestedMonth
    ? DateTime.fromFormat(requestedMonth, "yyyy-LL")
    : selectedMonth;

  return requestedMonthValue.isValid ? requestedMonthValue.startOf("month") : selectedMonth;
}

function buildAttendanceCalendarKey(staffId: string, attendanceDate: string) {
  return `${staffId}:${attendanceDate}`;
}
