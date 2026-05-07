"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { toUtcIso } from "@/lib/dates";
import { toFormActionState } from "@/lib/forms";
import { parseAttendanceEntryFormData, attendanceEntrySchema } from "@/features/attendance/schemas/attendance-form-schema";
import { parseStaffScheduleFormData, staffScheduleSchema } from "@/features/attendance/schemas/staff-schedule-schema";
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
  const { context, supabase } = await getAuthorizedSupabaseServerClient("attendance:write");
  const payrollLock = await getPayrollPeriodLockForDate(supabase, values.attendanceDate);

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
    staff_id: values.staffId,
    attendance_date: values.attendanceDate,
    time_in: values.timeIn ? toUtcIso(values.timeIn) : null,
    time_out: values.timeOut ? toUtcIso(values.timeOut) : null,
    status: values.status,
    notes: normalizeNullable(values.notes),
    approved_by_staff_id: null,
    approved_at: null,
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

export async function setAttendanceApprovalAction(
  _prevState: AttendanceEntryActionState = INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const attendanceId = readString(formData, "attendanceId");
  const approvalAction = readString(formData, "approvalAction");

  if (!attendanceId) {
    return {
      status: "error",
      message: "Attendance record is required.",
    };
  }

  if (approvalAction !== "approve" && approvalAction !== "unapprove") {
    return {
      status: "error",
      message: "Invalid attendance approval action.",
    };
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("attendance:write");
  const { data: existingAttendance, error: existingAttendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("id", attendanceId)
    .maybeSingle();

  if (existingAttendanceError) {
    return {
      status: "error",
      message: existingAttendanceError.message,
    };
  }

  if (!existingAttendance) {
    return {
      status: "error",
      message: "Attendance record no longer exists.",
    };
  }

  const payrollLock = await getPayrollPeriodLockForDate(supabase, existingAttendance.attendance_date);

  if (payrollLock?.status === "finalized") {
    return {
      status: "error",
      message: `Attendance approval is locked because payroll period ${payrollLock.label} is finalized.`,
    };
  }

  const nextApprovalState = approvalAction === "approve";
  const { data: savedAttendance, error } = await supabase
    .from("attendance")
    .update({
      approved_by_staff_id: nextApprovalState ? context.staffId : null,
      approved_at: nextApprovalState ? new Date().toISOString() : null,
    })
    .eq("id", attendanceId)
    .select("*")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await logAttendanceAdjustment({
    supabase,
    changedByStaffId: context.staffId,
    action: nextApprovalState ? "approved" : "unapproved",
    attendanceId: savedAttendance.id,
    staffId: savedAttendance.staff_id,
    attendanceDate: savedAttendance.attendance_date,
    previousData: serializeAttendanceSnapshot(existingAttendance),
    nextData: serializeAttendanceSnapshot(savedAttendance),
  });

  revalidatePath("/attendance");
  revalidatePath("/payroll");

  return {
    status: "success",
    message: nextApprovalState ? "Attendance approved." : "Attendance approval removed.",
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
  const { supabase } = await getAuthorizedSupabaseServerClient("attendance:write");
  const { error } = await supabase.from("staff_schedules").upsert(
    {
      staff_id: values.staffId,
      shift_start_time: `${values.shiftStartTime}:00`,
      shift_end_time: `${values.shiftEndTime}:00`,
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

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getPayrollPeriodLockForDate(
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"],
  attendanceDate: string,
) {
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

  return data;
}

async function logAttendanceAdjustment({
  supabase,
  changedByStaffId,
  action,
  attendanceId,
  staffId,
  attendanceDate,
  previousData,
  nextData,
}: {
  supabase: Awaited<ReturnType<typeof getAuthorizedSupabaseServerClient>>["supabase"];
  changedByStaffId: string;
  action: "created" | "updated" | "approved" | "unapproved";
  attendanceId: string;
  staffId: string;
  attendanceDate: string;
  previousData: Record<string, string | null> | null;
  nextData: Record<string, string | null> | null;
}) {
  const { error } = await supabase.from("attendance_adjustments").insert({
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
