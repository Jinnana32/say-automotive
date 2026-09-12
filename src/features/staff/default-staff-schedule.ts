import type { TableInsert, TableRow } from "@/types/database";

type StaffScheduleRow = TableRow<"staff_schedules">;
type StaffScheduleInsert = TableInsert<"staff_schedules">;

export const DEFAULT_NEW_STAFF_SCHEDULE = {
  shift_start_time: "08:00:00",
  shift_end_time: "17:00:00",
  grace_minutes: 0,
  monday_is_workday: true,
  tuesday_is_workday: true,
  wednesday_is_workday: true,
  thursday_is_workday: true,
  friday_is_workday: true,
  saturday_is_workday: true,
  sunday_is_workday: false,
  notes: null,
} as const satisfies Omit<StaffScheduleInsert, "staff_id" | "id" | "created_at" | "updated_at">;

export function buildStaffScheduleInsertFromSource(
  staffId: string,
  source: StaffScheduleRow | null,
): StaffScheduleInsert {
  if (!source) {
    return {
      staff_id: staffId,
      ...DEFAULT_NEW_STAFF_SCHEDULE,
    };
  }

  return {
    staff_id: staffId,
    shift_start_time: source.shift_start_time,
    shift_end_time: source.shift_end_time,
    grace_minutes: source.grace_minutes,
    monday_is_workday: source.monday_is_workday,
    tuesday_is_workday: source.tuesday_is_workday,
    wednesday_is_workday: source.wednesday_is_workday,
    thursday_is_workday: source.thursday_is_workday,
    friday_is_workday: source.friday_is_workday,
    saturday_is_workday: source.saturday_is_workday,
    sunday_is_workday: source.sunday_is_workday,
    notes: source.notes,
  };
}
