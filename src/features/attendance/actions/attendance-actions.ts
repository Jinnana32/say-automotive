"use server";

import { revalidatePath } from "next/cache";

import { getBranchScopedServerClient, requireBranchAccess } from "@/lib/branches";
import { toUtcIso } from "@/lib/dates";
import { toFormActionState } from "@/lib/forms";
import { parseAttendanceEntryFormData, attendanceEntrySchema } from "@/features/attendance/schemas/attendance-form-schema";
import { parseStaffScheduleFormData, staffScheduleSchema } from "@/features/attendance/schemas/staff-schedule-schema";
import { formatStaffScheduleTimeForStorage } from "@/features/attendance/schedule-time-utils";
import type { AttendanceEntryActionState } from "@/features/attendance/types";
import { INITIAL_ATTENDANCE_ENTRY_ACTION_STATE } from "@/features/attendance/utils";
import type { TableInsert } from "@/types/database";

export async function upsertAttendanceRecordAction(
  _prevState: AttendanceEntryActionState = INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const parsed = attendanceEntrySchema.safeParse(parseAttendanceEntryFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("attendance:write");
  const branchId = await getAttendanceStaffBranchId(supabase, values.staffId);

  await requireBranchAccess(branchId);

  const { data: businessSettings, error: businessSettingsError } = await supabase
    .from("business_settings")
    .select("allow_attendance_admin_override")
    .eq("branch_id", branchId)
    .single();

  if (businessSettingsError) {
    return {
      status: "error",
      message: businessSettingsError.message,
    };
  }

  if (!businessSettings.allow_attendance_admin_override) {
    return {
      status: "error",
      message:
        "Manual attendance overrides are disabled in timekeeping settings. Review DTR amendments instead.",
    };
  }

  const payrollLock = await getPayrollPeriodLockForDate(supabase, branchId, values.attendanceDate);

  if (payrollLock) {
    return {
      status: "error",
      message:
        payrollLock.status === "finalized"
          ? `Attendance is locked because payroll period ${payrollLock.label} is finalized.`
          : `Attendance is locked because payroll period ${payrollLock.label} is in processing.`,
    };
  }

  const { data: existingAttendance, error: existingAttendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", values.staffId)
    .eq("attendance_date", values.attendanceDate)
    .maybeSingle();

  if (existingAttendanceError) {
    return {
      status: "error",
      message: existingAttendanceError.message,
    };
  }

  const payload: TableInsert<"attendance"> = {
    branch_id: branchId,
    staff_id: values.staffId,
    attendance_date: values.attendanceDate,
    time_in: values.timeIn ? toUtcIso(values.timeIn) : null,
    time_out: values.timeOut ? toUtcIso(values.timeOut) : null,
    status: values.status,
    notes: normalizeNullable(values.notes),
    approved_by_staff_id: context.staffId,
    approved_at: new Date().toISOString(),
  };
  const operation = existingAttendance
    ? supabase.from("attendance").update(payload).eq("id", existingAttendance.id).select("*").single()
    : supabase.from("attendance").insert(payload).select("*").single();
  const { data: savedAttendance, error } = await operation;

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await logAttendanceAdjustment({
    branchId,
    supabase,
    changedByStaffId: context.staffId,
    action: existingAttendance ? "updated" : "created",
    attendanceId: savedAttendance.id,
    staffId: savedAttendance.staff_id,
    attendanceDate: savedAttendance.attendance_date,
    previousData: existingAttendance ? serializeAttendanceSnapshot(existingAttendance) : null,
    nextData: serializeAttendanceSnapshot(savedAttendance),
  });

  revalidatePath("/attendance");
  revalidatePath("/payroll");

  return {
    status: "success",
    message: "Attendance saved.",
  };
}

export async function upsertStaffScheduleAction(
  _prevState: AttendanceEntryActionState = INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const parsed = staffScheduleSchema.safeParse(parseStaffScheduleFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { supabase } = await getBranchScopedServerClient("attendance:write");
  const { error } = await supabase.from("staff_schedules").upsert(
    {
      staff_id: values.staffId,
      shift_start_time: formatStaffScheduleTimeForStorage(values.shiftStartTime),
      shift_end_time: formatStaffScheduleTimeForStorage(values.shiftEndTime),
      grace_minutes: Number(values.graceMinutes),
      monday_is_workday: values.mondayIsWorkday,
      tuesday_is_workday: values.tuesdayIsWorkday,
      wednesday_is_workday: values.wednesdayIsWorkday,
      thursday_is_workday: values.thursdayIsWorkday,
      friday_is_workday: values.fridayIsWorkday,
      saturday_is_workday: values.saturdayIsWorkday,
      sunday_is_workday: values.sundayIsWorkday,
      notes: normalizeNullable(values.notes),
    },
    {
      onConflict: "staff_id",
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/attendance");
  revalidatePath("/payroll");

  return {
    status: "success",
    message: "Staff schedule saved.",
  };
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function getAttendanceStaffBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  staffId: string,
) {
  const { data, error } = await supabase.from("staff").select("branch_id").eq("id", staffId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Selected staff member is not assigned to a branch.");
  }

  return data.branch_id;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getPayrollPeriodLockForDate(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string,
  attendanceDate: string,
) {
  const { data, error } = await supabase
    .from("payroll_periods")
    .select("id, label, status")
    .in("status", ["processing", "finalized"])
    .eq("branch_id", branchId)
    .lte("period_start_date", attendanceDate)
    .gte("period_end_date", attendanceDate)
    .order("period_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function logAttendanceAdjustment({
  branchId,
  supabase,
  changedByStaffId,
  action,
  attendanceId,
  staffId,
  attendanceDate,
  previousData,
  nextData,
}: {
  branchId: string;
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  changedByStaffId: string;
  action: "created" | "updated" | "approved" | "unapproved";
  attendanceId: string;
  staffId: string;
  attendanceDate: string;
  previousData: Record<string, string | null> | null;
  nextData: Record<string, string | null> | null;
}) {
  const { error } = await supabase.from("attendance_adjustments").insert({
    branch_id: branchId,
    attendance_id: attendanceId,
    staff_id: staffId,
    attendance_date: attendanceDate,
    action,
    previous_data: previousData,
    next_data: nextData,
    changed_by_staff_id: changedByStaffId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function serializeAttendanceSnapshot(row: {
  status: string;
  time_in: string | null;
  time_out: string | null;
  notes: string | null;
  approved_at: string | null;
}) {
  return {
    status: row.status,
    time_in: row.time_in,
    time_out: row.time_out,
    notes: row.notes,
    approved_at: row.approved_at,
  };
}
