import { describe, expect, it } from "vitest";

import {
  buildStaffScheduleInsertFromSource,
  DEFAULT_NEW_STAFF_SCHEDULE,
} from "@/features/staff/default-staff-schedule";
import type { TableRow } from "@/types/database";

type StaffScheduleRow = TableRow<"staff_schedules">;

describe("buildStaffScheduleInsertFromSource", () => {
  it("copies an existing staff schedule onto the new staff member", () => {
    const source: StaffScheduleRow = {
      id: "schedule-1",
      staff_id: "staff-source",
      shift_start_time: "09:00:00",
      shift_end_time: "18:00:00",
      grace_minutes: 10,
      monday_is_workday: true,
      tuesday_is_workday: true,
      wednesday_is_workday: true,
      thursday_is_workday: true,
      friday_is_workday: true,
      saturday_is_workday: false,
      sunday_is_workday: false,
      notes: "Office hours",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    expect(buildStaffScheduleInsertFromSource("staff-new", source)).toEqual({
      staff_id: "staff-new",
      shift_start_time: "09:00:00",
      shift_end_time: "18:00:00",
      grace_minutes: 10,
      monday_is_workday: true,
      tuesday_is_workday: true,
      wednesday_is_workday: true,
      thursday_is_workday: true,
      friday_is_workday: true,
      saturday_is_workday: false,
      sunday_is_workday: false,
      notes: "Office hours",
    });
  });

  it("falls back to the shop weekday default when no source schedule exists", () => {
    expect(buildStaffScheduleInsertFromSource("staff-new", null)).toEqual({
      staff_id: "staff-new",
      ...DEFAULT_NEW_STAFF_SCHEDULE,
    });
  });
});
