import type { SupabaseClient } from "@supabase/supabase-js";

import { getBusinessNow } from "@/lib/dates";
import { deriveAttendanceStatusFromTimeIn } from "@/features/attendance/utils";
import type {
  AttendanceLogSource,
  AttendanceLogType,
  AttendanceStatus,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import type { Database, TableInsert, TableRow } from "@/types/database";

export type DatabaseClient = SupabaseClient<Database>;

export async function getPayrollPeriodLockForDate(
  supabase: DatabaseClient,
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

export function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function serializeAttendanceSnapshot(row: {
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

export async function logAttendanceAdjustment({
  supabase,
  changedByStaffId,
  action,
  attendanceId,
  staffId,
  attendanceDate,
  previousData,
  nextData,
  reason,
}: {
  supabase: DatabaseClient;
  changedByStaffId: string | null;
  action: "created" | "updated" | "approved" | "unapproved";
  attendanceId: string;
  staffId: string;
  attendanceDate: string;
  previousData: Record<string, string | null> | null;
  nextData: Record<string, string | null> | null;
  reason?: string | null;
}) {
  const { error } = await supabase.from("attendance_adjustments").insert({
    attendance_id: attendanceId,
    staff_id: staffId,
    attendance_date: attendanceDate,
    action,
    previous_data: previousData,
    next_data: nextData,
    reason: reason ?? null,
    changed_by_staff_id: changedByStaffId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertAttendanceTimeLog({
  supabase,
  staffId,
  attendanceId,
  amendmentId,
  staffDeviceId,
  attendanceDate,
  logType,
  loggedAt,
  source,
  requestIp,
  isShopIpValid,
  isDeviceApproved,
  userAgent,
}: {
  supabase: DatabaseClient;
  staffId: string;
  attendanceId: string | null;
  amendmentId?: string | null;
  staffDeviceId?: string | null;
  attendanceDate: string;
  logType: AttendanceLogType;
  loggedAt: string;
  source: AttendanceLogSource;
  requestIp: string | null;
  isShopIpValid: boolean;
  isDeviceApproved: boolean;
  userAgent: string | null;
}) {
  const payload: TableInsert<"attendance_time_logs"> = {
    staff_id: staffId,
    attendance_id: attendanceId,
    dtr_amendment_id: amendmentId ?? null,
    staff_device_id: staffDeviceId ?? null,
    attendance_date: attendanceDate,
    log_type: logType,
    logged_at: loggedAt,
    source,
    request_ip: requestIp,
    is_shop_ip_valid: isShopIpValid,
    is_device_approved: isDeviceApproved,
    user_agent: userAgent,
  };
  const { error } = await supabase.from("attendance_time_logs").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export function derivePortalAttendanceStatus({
  schedule,
  timeInUtcIso,
}: {
  schedule: StaffScheduleSummary | null;
  timeInUtcIso: string;
}): AttendanceStatus {
  return deriveAttendanceStatusFromTimeIn({
    schedule,
    timeInUtcIso,
  });
}

export async function findAttendanceRecordForDate({
  supabase,
  staffId,
  attendanceDate,
}: {
  supabase: DatabaseClient;
  staffId: string;
  attendanceDate: string;
}) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", staffId)
    .eq("attendance_date", attendanceDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TableRow<"attendance"> | null) ?? null;
}

export function getCurrentBusinessAttendanceDate() {
  return getBusinessNow().toFormat("yyyy-LL-dd");
}
