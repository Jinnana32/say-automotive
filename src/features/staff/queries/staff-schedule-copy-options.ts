import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { formatScheduleTimeRange } from "@/features/attendance/utils";
import type { StaffScheduleCopyOption } from "@/features/staff/types";
import type { TableRow } from "@/types/database";

type StaffScheduleRow = TableRow<"staff_schedules">;
type StaffRow = Pick<TableRow<"staff">, "id" | "first_name" | "last_name" | "status">;

const WORKDAY_SHORT_LABELS = [
  { key: "monday_is_workday", label: "Mon" },
  { key: "tuesday_is_workday", label: "Tue" },
  { key: "wednesday_is_workday", label: "Wed" },
  { key: "thursday_is_workday", label: "Thu" },
  { key: "friday_is_workday", label: "Fri" },
  { key: "saturday_is_workday", label: "Sat" },
  { key: "sunday_is_workday", label: "Sun" },
] as const;

export async function listStaffScheduleCopyOptions(): Promise<StaffScheduleCopyOption[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("staff:read");
  const { data: staffData, error: staffError } = await applyBranchFilter(
    supabase
      .from("staff")
      .select("id, first_name, last_name, status")
      .eq("status", "active")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    branchScope.selectedBranchId,
  );

  if (staffError) {
    throw new Error(staffError.message);
  }

  const staffRows = (staffData ?? []) as StaffRow[];
  if (staffRows.length === 0) {
    return [];
  }

  const staffById = new Map(staffRows.map((row) => [row.id, row]));
  const { data: scheduleData, error: scheduleError } = await supabase
    .from("staff_schedules")
    .select("*")
    .in(
      "staff_id",
      staffRows.map((row) => row.id),
    )
    .order("updated_at", { ascending: false });

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  return ((scheduleData ?? []) as StaffScheduleRow[])
    .map((schedule) => {
      const staff = staffById.get(schedule.staff_id);
      if (!staff) {
        return null;
      }

      return {
        staffId: staff.id,
        fullName: `${staff.first_name} ${staff.last_name}`.trim(),
        summary: formatScheduleCopySummary(schedule),
      } satisfies StaffScheduleCopyOption;
    })
    .filter((option): option is StaffScheduleCopyOption => option !== null)
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function formatScheduleCopySummary(schedule: StaffScheduleRow) {
  const workdays = WORKDAY_SHORT_LABELS.filter((day) => schedule[day.key]).map((day) => day.label);
  const workdayLabel = workdays.length > 0 ? workdays.join(", ") : "No workdays";
  const timeRange = formatScheduleTimeRange({
    id: schedule.id,
    staffId: schedule.staff_id,
    shiftStartTime: schedule.shift_start_time,
    shiftEndTime: schedule.shift_end_time,
    graceMinutes: schedule.grace_minutes,
    mondayIsWorkday: schedule.monday_is_workday,
    tuesdayIsWorkday: schedule.tuesday_is_workday,
    wednesdayIsWorkday: schedule.wednesday_is_workday,
    thursdayIsWorkday: schedule.thursday_is_workday,
    fridayIsWorkday: schedule.friday_is_workday,
    saturdayIsWorkday: schedule.saturday_is_workday,
    sundayIsWorkday: schedule.sunday_is_workday,
    notes: schedule.notes,
  });

  return `${workdayLabel} · ${timeRange}`;
}
