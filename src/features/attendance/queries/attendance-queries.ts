import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type {
  AttendanceDateLockSummary,
  BranchHolidaySummary,
  AttendanceRecordSummary,
  AttendanceRosterData,
  AttendanceRosterItem,
  AttendancePageFilters,
  StaffLeaveEntrySummary,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import { buildAttendanceSummary, hasMissingTimeout, isAttendanceApproved, matchesAttendanceStatusFilter } from "@/features/attendance/utils";
import type { TableRow } from "@/types/database";

type StaffAttendanceRosterRow = Pick<
  TableRow<"staff">,
  "id" | "first_name" | "last_name" | "role" | "status" | "contact_number"
>;
type AttendanceRow = TableRow<"attendance">;
type StaffScheduleRow = TableRow<"staff_schedules">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type PayrollPeriodLockRow = Pick<
  TableRow<"payroll_periods">,
  "id" | "label" | "status"
>;

export async function getAttendanceRosterData(
  filters: AttendancePageFilters,
): Promise<AttendanceRosterData> {
  const { context, supabase } = await getAuthorizedSupabaseServerClient("attendance:read");
  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  let staffQuery = supabase
    .from("staff")
    .select("id, first_name, last_name, role, status, contact_number")
    .eq("status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

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
