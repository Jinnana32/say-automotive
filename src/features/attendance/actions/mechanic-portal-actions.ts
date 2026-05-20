"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { requireAuthenticatedStaff, getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { toUtcIso, getBusinessNow } from "@/lib/dates";
import { toFormActionState } from "@/lib/forms";
import { ipMatchesAllowedList } from "@/lib/network/request-ip";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  parseDtrAmendmentFormData,
  dtrAmendmentFormSchema,
  parseDtrAmendmentReviewFormData,
  dtrAmendmentReviewSchema,
} from "@/features/attendance/schemas/dtr-amendment-schema";
import {
  derivePortalAttendanceStatus,
  findAttendanceRecordForDate,
  getCurrentBusinessAttendanceDate,
  getPayrollPeriodLockForDate,
  insertAttendanceTimeLog,
  logAttendanceAdjustment,
  normalizeNullable,
  serializeAttendanceSnapshot,
  type DatabaseClient,
} from "@/features/attendance/server-utils";
import { getAttendanceAccessContext } from "@/features/attendance/queries/attendance-amendment-queries";
import type {
  AttendanceEntryActionState,
  AttendanceLogType,
  StaffScheduleSummary,
  TimekeepingActionState,
} from "@/features/attendance/types";
import {
  getMechanicPortalPrimaryActionLabel,
  getMechanicPortalPrimaryLogType,
  INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  INITIAL_TIMEKEEPING_ACTION_STATE,
} from "@/features/attendance/utils";
import type { TableInsert, TableRow, TableUpdate } from "@/types/database";

type AttendanceRow = TableRow<"attendance">;
type DtrAmendmentRow = TableRow<"dtr_amendment_requests">;

export async function recordMechanicAttendanceLogAction(
  _prevState: AttendanceEntryActionState = INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  formData: FormData,
): Promise<AttendanceEntryActionState> {
  const context = await requireMechanicPortalContext();
  const admin = getSupabaseAdminClient();
  const accessContext = await getAttendanceAccessContext({
    admin,
    branchId: context.branchId,
    staffId: context.staffId,
    userId: context.userId,
  });
  const attendanceDate = getCurrentBusinessAttendanceDate();
  const payrollLock = await getPayrollPeriodLockForDate(
    admin,
    accessContext.branchId,
    attendanceDate,
  );

  if (payrollLock) {
    return {
      status: "error",
      message:
        payrollLock.status === "finalized"
          ? `Today's attendance is locked because payroll period ${payrollLock.label} is finalized.`
          : `Today's attendance is locked because payroll period ${payrollLock.label} is in processing.`,
    };
  }

  const existingAttendance = await findAttendanceRecordForDate({
    supabase: admin,
    staffId: context.staffId,
    attendanceDate,
  });
  const nextExpectedLogType = getMechanicPortalPrimaryLogType(
    existingAttendance ? mapAttendanceRecord(existingAttendance) : null,
  );
  const requestedLogType = readLogType(formData, "logType");

  if (!nextExpectedLogType) {
    return {
      status: "error",
      message: "Today's attendance already has both time in and time out recorded.",
    };
  }

  if (requestedLogType && requestedLogType !== nextExpectedLogType) {
    return {
      status: "error",
      message: `The next available action is ${getMechanicPortalPrimaryActionLabel(
        existingAttendance ? mapAttendanceRecord(existingAttendance) : null,
      )}.`,
    };
  }

  if (!accessContext.ipStatus.isAllowed) {
    await writeAuditLog(admin, {
      action: "Blocked mechanic portal attendance attempt",
      entityType: "attendance_time_log",
      userId: context.userId,
      afterData: {
        staff_id: context.staffId,
        attendance_date: attendanceDate,
        attempted_log_type: nextExpectedLogType,
        request_ip: accessContext.ipStatus.requestIp,
        is_shop_ip_valid: false,
        staff_device_id: accessContext.deviceStatus.currentDevice?.id ?? null,
        is_device_approved: accessContext.deviceStatus.isApproved,
      },
    });

    return {
      status: "error",
      message:
        "You are not connected to the approved shop network. File a DTR amendment if this attendance needs admin review.",
    };
  }

  if (!accessContext.deviceStatus.isApproved) {
    await writeAuditLog(admin, {
      action: "Blocked mechanic portal attendance attempt due to unapproved device",
      entityType: "attendance_time_log",
      userId: context.userId,
      afterData: {
        staff_id: context.staffId,
        attendance_date: attendanceDate,
        attempted_log_type: nextExpectedLogType,
        request_ip: accessContext.ipStatus.requestIp,
        is_shop_ip_valid: accessContext.ipStatus.isAllowed,
        staff_device_id: accessContext.deviceStatus.currentDevice?.id ?? null,
        device_status: accessContext.deviceStatus.status,
      },
    });

    return {
      status: "error",
      message:
        accessContext.deviceStatus.status === "registered_to_other_staff"
          ? "This device is already bound to another mechanic account and cannot be used for your attendance."
          : "This device is not approved for time-in/time-out yet. Ask the owner or admin to approve it, or file a DTR amendment.",
    };
  }

  const schedule = await getStaffSchedule(admin, context.staffId);
  const loggedAt = ensureIso(getBusinessNow().toUTC().toISO());
  const previousSnapshot = existingAttendance
    ? serializeAttendanceSnapshot(existingAttendance)
    : null;
  let savedAttendance: AttendanceRow;

  if (nextExpectedLogType === "time_in") {
    const operation = existingAttendance
      ? admin
          .from("attendance")
          .update({
            time_in: loggedAt,
            status: derivePortalAttendanceStatus({
              schedule,
              timeInUtcIso: loggedAt,
            }),
            approved_at: loggedAt,
            approved_by_staff_id: null,
          } satisfies TableUpdate<"attendance">)
          .eq("id", existingAttendance.id)
          .select("*")
          .single()
      : admin
          .from("attendance")
          .insert({
            branch_id: accessContext.branchId,
            staff_id: context.staffId,
            attendance_date: attendanceDate,
            time_in: loggedAt,
            time_out: null,
            status: derivePortalAttendanceStatus({
              schedule,
              timeInUtcIso: loggedAt,
            }),
            notes: null,
            approved_at: loggedAt,
            approved_by_staff_id: null,
          } satisfies TableInsert<"attendance">)
          .select("*")
          .single();
    const { data, error } = await operation;

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    savedAttendance = data as AttendanceRow;
  } else {
    if (!existingAttendance?.time_in) {
      return {
        status: "error",
        message: "Time out is not allowed until a time in exists for today.",
      };
    }

    const { data, error } = await admin
      .from("attendance")
      .update({
        time_out: loggedAt,
        approved_at: loggedAt,
        approved_by_staff_id: null,
      } satisfies TableUpdate<"attendance">)
      .eq("id", existingAttendance.id)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    savedAttendance = data as AttendanceRow;
  }

  await logAttendanceAdjustment({
    branchId: accessContext.branchId,
    supabase: admin,
    changedByStaffId: context.staffId,
    action: existingAttendance ? "updated" : "created",
    attendanceId: savedAttendance.id,
    staffId: savedAttendance.staff_id,
    attendanceDate: savedAttendance.attendance_date,
    previousData: previousSnapshot,
    nextData: serializeAttendanceSnapshot(savedAttendance),
    reason: "Mechanic portal punch",
  });

  await insertAttendanceTimeLog({
    branchId: accessContext.branchId,
    supabase: admin,
    staffId: context.staffId,
    attendanceId: savedAttendance.id,
    attendanceDate,
    logType: nextExpectedLogType,
    loggedAt,
    source: "mechanic_portal",
    requestIp: accessContext.ipStatus.requestIp,
    isShopIpValid: true,
    staffDeviceId: accessContext.deviceStatus.currentDevice?.id ?? null,
    isDeviceApproved: true,
    userAgent: accessContext.requestUserAgent,
  });

  await writeAuditLog(admin, {
    action: `Recorded mechanic portal ${nextExpectedLogType.replace("_", " ")}`,
    entityType: "attendance",
    entityId: savedAttendance.id,
    userId: context.userId,
    beforeData: previousSnapshot,
    afterData: savedAttendance,
  });

  revalidateAttendancePortalPaths();

  return {
    status: "success",
    message:
      nextExpectedLogType === "time_in"
        ? "Time in recorded."
        : "Time out recorded.",
  };
}

export async function submitDtrAmendmentAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = dtrAmendmentFormSchema.safeParse(parseDtrAmendmentFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const context = await requireMechanicPortalContext();
  const admin = getSupabaseAdminClient();
  const accessContext = await getAttendanceAccessContext({
    admin,
    branchId: context.branchId,
    staffId: context.staffId,
    userId: context.userId,
  });

  if (!accessContext.settings.allowDtrAmendments) {
    return {
      status: "error",
      message: "DTR amendments are currently disabled for this branch.",
    };
  }

  const payrollLock = await getPayrollPeriodLockForDate(
    admin,
    accessContext.branchId,
    parsed.data.attendanceDate,
  );

  if (payrollLock) {
    return {
      status: "error",
      message:
        payrollLock.status === "finalized"
          ? `That attendance date is locked because payroll period ${payrollLock.label} is finalized.`
          : `That attendance date is locked because payroll period ${payrollLock.label} is in processing.`,
    };
  }

  const { data: duplicateAmendment, error: duplicateError } = await admin
    .from("dtr_amendment_requests")
    .select("id")
    .eq("staff_id", context.staffId)
    .eq("attendance_date", parsed.data.attendanceDate)
    .eq("target_log_type", parsed.data.targetLogType)
    .eq("status", "pending")
    .maybeSingle();

  if (duplicateError) {
    return {
      status: "error",
      message: duplicateError.message,
    };
  }

  if (duplicateAmendment) {
    return {
      status: "error",
      message: "A pending amendment already exists for that attendance action.",
    };
  }

  const existingAttendance = await findAttendanceRecordForDate({
    supabase: admin,
    staffId: context.staffId,
    attendanceDate: parsed.data.attendanceDate,
  });

  if (
    parsed.data.amendmentType !== "wrong_time" &&
    ((parsed.data.targetLogType === "time_in" && existingAttendance?.time_in) ||
      (parsed.data.targetLogType === "time_out" && existingAttendance?.time_out))
  ) {
    return {
      status: "error",
      message: "That attendance time is already recorded. Use Wrong time if the timestamp needs correction.",
    };
  }

  const requestedTimestamp = ensureIso(
    toUtcIso(`${parsed.data.attendanceDate}T${parsed.data.requestedTime}`),
  );
  const payload: TableInsert<"dtr_amendment_requests"> = {
    branch_id: accessContext.branchId,
    staff_id: context.staffId,
    attendance_id: existingAttendance?.id ?? null,
    attendance_date: parsed.data.attendanceDate,
    target_log_type: parsed.data.targetLogType,
    amendment_type: parsed.data.amendmentType,
    requested_timestamp: requestedTimestamp,
    reason: parsed.data.reason.trim(),
    proof_url: null,
    status: "pending",
    requested_ip: accessContext.ipStatus.requestIp,
    request_user_agent: accessContext.requestUserAgent,
    approved_timestamp: null,
    approved_by_staff_id: null,
    rejected_at: null,
    rejected_by_staff_id: null,
    final_timestamp: null,
    admin_note: null,
  };
  const { data, error } = await admin
    .from("dtr_amendment_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await writeAuditLog(admin, {
    action: "Submitted DTR amendment request",
    entityType: "dtr_amendment_request",
    entityId: data.id,
    userId: context.userId,
    afterData: data,
  });

  revalidateAttendancePortalPaths();

  return {
    status: "success",
    message: "DTR amendment submitted for admin review.",
  };
}

export async function reviewDtrAmendmentAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = dtrAmendmentReviewSchema.safeParse(
    parseDtrAmendmentReviewFormData(formData),
  );

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const { context } = await getAuthorizedSupabaseServerClient("attendance:write");
  const admin = getSupabaseAdminClient();
  const { data: amendmentData, error: amendmentError } = await admin
    .from("dtr_amendment_requests")
    .select("*")
    .eq("id", parsed.data.amendmentId)
    .maybeSingle();

  if (amendmentError) {
    return {
      status: "error",
      message: amendmentError.message,
    };
  }

  if (!amendmentData) {
    return {
      status: "error",
      message: "Amendment request no longer exists.",
    };
  }

  const amendment = amendmentData as DtrAmendmentRow;

  if (amendment.status !== "pending") {
    return {
      status: "error",
      message: "Only pending amendments can be reviewed.",
    };
  }

  const payrollLock = await getPayrollPeriodLockForDate(
    admin,
    amendment.branch_id,
    amendment.attendance_date,
  );

  if (payrollLock) {
    return {
      status: "error",
      message:
        payrollLock.status === "finalized"
          ? `This amendment is locked because payroll period ${payrollLock.label} is finalized.`
          : `This amendment is locked because payroll period ${payrollLock.label} is in processing.`,
    };
  }

  const reviewedAt = ensureIso(getBusinessNow().toUTC().toISO());

  if (parsed.data.decision === "rejected") {
    const { data: savedAmendment, error } = await admin
      .from("dtr_amendment_requests")
      .update({
        status: "rejected",
        rejected_at: reviewedAt,
        rejected_by_staff_id: context.staffId,
        admin_note: normalizeNullable(parsed.data.adminNote),
      })
      .eq("id", amendment.id)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    await writeAuditLog(admin, {
      action: "Rejected DTR amendment request",
      entityType: "dtr_amendment_request",
      entityId: amendment.id,
      userId: context.userId,
      beforeData: amendment,
      afterData: savedAmendment,
    });

    revalidateAttendancePortalPaths();

    return {
      status: "success",
      message: "Amendment rejected.",
    };
  }

  const finalTimestamp = ensureIso(
    toUtcIso(`${amendment.attendance_date}T${parsed.data.finalTime}`),
  );
  const existingAttendance = await findAttendanceRecordForDate({
    supabase: admin,
    staffId: amendment.staff_id,
    attendanceDate: amendment.attendance_date,
  });
  const schedule = await getStaffSchedule(admin, amendment.staff_id);
  const nextAttendanceValues = buildApprovedAmendmentAttendancePayload({
    amendment,
    existingAttendance,
    finalTimestamp,
    schedule,
    approvedAt: reviewedAt,
    approvedByStaffId: context.staffId,
  });

  if ("error" in nextAttendanceValues) {
    return {
      status: "error",
      message: nextAttendanceValues.error,
    };
  }

  const operation = existingAttendance
    ? admin
        .from("attendance")
        .update(nextAttendanceValues.updatePayload)
        .eq("id", existingAttendance.id)
        .select("*")
        .single()
    : admin
        .from("attendance")
        .insert(nextAttendanceValues.insertPayload)
        .select("*")
        .single();
  const { data: savedAttendanceData, error: savedAttendanceError } = await operation;

  if (savedAttendanceError) {
    return {
      status: "error",
      message: savedAttendanceError.message,
    };
  }

  const savedAttendance = savedAttendanceData as AttendanceRow;
  const allowedIpRows = await getAllowedBranchIps(admin, amendment.branch_id);
  const amendmentRequestIpIsValid = amendment.requested_ip
    ? Boolean(
        ipMatchesAllowedList(
          amendment.requested_ip,
          allowedIpRows.map((row) => ({ ipAddress: row.ip_address })),
        ),
      )
    : false;

  await logAttendanceAdjustment({
    branchId: amendment.branch_id,
    supabase: admin,
    changedByStaffId: context.staffId,
    action: existingAttendance ? "updated" : "created",
    attendanceId: savedAttendance.id,
    staffId: savedAttendance.staff_id,
    attendanceDate: savedAttendance.attendance_date,
    previousData: existingAttendance
      ? serializeAttendanceSnapshot(existingAttendance)
      : null,
    nextData: serializeAttendanceSnapshot(savedAttendance),
    reason: `Approved DTR amendment (${amendment.amendment_type})`,
  });

  await insertAttendanceTimeLog({
    branchId: amendment.branch_id,
    supabase: admin,
    staffId: amendment.staff_id,
    attendanceId: savedAttendance.id,
    amendmentId: amendment.id,
    attendanceDate: amendment.attendance_date,
    logType: amendment.target_log_type as AttendanceLogType,
    loggedAt: finalTimestamp,
    source: "admin_approved_amendment",
    requestIp: amendment.requested_ip,
    isShopIpValid: amendmentRequestIpIsValid,
    staffDeviceId: null,
    isDeviceApproved: false,
    userAgent: amendment.request_user_agent,
  });

  const { data: savedAmendment, error: savedAmendmentError } = await admin
    .from("dtr_amendment_requests")
    .update({
      attendance_id: savedAttendance.id,
      status: "approved",
      approved_timestamp: reviewedAt,
      approved_by_staff_id: context.staffId,
      final_timestamp: finalTimestamp,
      admin_note: normalizeNullable(parsed.data.adminNote),
    })
    .eq("id", amendment.id)
    .select("*")
    .single();

  if (savedAmendmentError) {
    return {
      status: "error",
      message: savedAmendmentError.message,
    };
  }

  await writeAuditLog(admin, {
    action: "Approved DTR amendment request",
    entityType: "dtr_amendment_request",
    entityId: amendment.id,
    userId: context.userId,
    beforeData: amendment,
    afterData: savedAmendment,
  });

  revalidateAttendancePortalPaths();

  return {
    status: "success",
    message: "Amendment approved and attendance updated.",
  };
}

async function getStaffSchedule(admin: DatabaseClient, staffId: string): Promise<StaffScheduleSummary | null> {
  const { data, error } = await admin
    .from("staff_schedules")
    .select("*")
    .eq("staff_id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    staffId: data.staff_id,
    shiftStartTime: data.shift_start_time,
    shiftEndTime: data.shift_end_time,
    graceMinutes: data.grace_minutes,
    mondayIsWorkday: data.monday_is_workday,
    tuesdayIsWorkday: data.tuesday_is_workday,
    wednesdayIsWorkday: data.wednesday_is_workday,
    thursdayIsWorkday: data.thursday_is_workday,
    fridayIsWorkday: data.friday_is_workday,
    saturdayIsWorkday: data.saturday_is_workday,
    sundayIsWorkday: data.sunday_is_workday,
    notes: data.notes,
  };
}

async function getAllowedBranchIps(admin: DatabaseClient, branchId: string) {
  const { data, error } = await admin
    .from("attendance_allowed_ips")
    .select("ip_address")
    .eq("branch_id", branchId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<Pick<TableRow<"attendance_allowed_ips">, "ip_address">>;
}

function buildApprovedAmendmentAttendancePayload({
  amendment,
  existingAttendance,
  finalTimestamp,
  schedule,
  approvedAt,
  approvedByStaffId,
}: {
  amendment: DtrAmendmentRow;
  existingAttendance: AttendanceRow | null;
  finalTimestamp: string;
  schedule: StaffScheduleSummary | null;
  approvedAt: string;
  approvedByStaffId: string;
}):
  | {
      updatePayload: TableUpdate<"attendance">;
      insertPayload: TableInsert<"attendance">;
    }
  | {
      error: string;
    } {
  if (amendment.target_log_type === "time_in") {
    if (existingAttendance?.time_out && finalTimestamp > existingAttendance.time_out) {
      return {
        error: "The approved time in cannot be later than the existing time out.",
      };
    }

    return {
      updatePayload: {
        time_in: finalTimestamp,
        status: derivePortalAttendanceStatus({
          schedule,
          timeInUtcIso: finalTimestamp,
        }),
        approved_at: approvedAt,
        approved_by_staff_id: approvedByStaffId,
      } satisfies TableUpdate<"attendance">,
      insertPayload: {
        branch_id: amendment.branch_id,
        staff_id: amendment.staff_id,
        attendance_date: amendment.attendance_date,
        time_in: finalTimestamp,
        time_out: null,
        status: derivePortalAttendanceStatus({
          schedule,
          timeInUtcIso: finalTimestamp,
        }),
        notes: null,
        approved_at: approvedAt,
        approved_by_staff_id: approvedByStaffId,
      } satisfies TableInsert<"attendance">,
    };
  }

  if (!existingAttendance?.time_in) {
    return {
      error: "A time in record is required before approving a time out amendment.",
    };
  }

  if (finalTimestamp < existingAttendance.time_in) {
    return {
      error: "The approved time out cannot be earlier than the recorded time in.",
    };
  }

  return {
    updatePayload: {
      time_out: finalTimestamp,
      approved_at: approvedAt,
      approved_by_staff_id: approvedByStaffId,
    } satisfies TableUpdate<"attendance">,
    insertPayload: {
      branch_id: amendment.branch_id,
      staff_id: amendment.staff_id,
      attendance_date: amendment.attendance_date,
      time_in: existingAttendance.time_in,
      time_out: finalTimestamp,
      status: existingAttendance.status,
      notes: existingAttendance.notes,
      approved_at: approvedAt,
      approved_by_staff_id: approvedByStaffId,
    } satisfies TableInsert<"attendance">,
  };
}

function mapAttendanceRecord(row: AttendanceRow) {
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

function readLogType(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === "time_in" || value === "time_out") {
    return value;
  }

  return null;
}

function ensureIso(value: string | null) {
  if (!value) {
    throw new Error("Expected a valid ISO timestamp.");
  }

  return value;
}

async function requireMechanicPortalContext() {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "mechanic") {
    redirect("/dashboard");
  }

  return context;
}

function revalidateAttendancePortalPaths() {
  revalidatePath("/attendance");
  revalidatePath("/attendance/amendments");
  revalidatePath("/payroll");
  revalidatePath("/portal/attendance");
  revalidatePath("/portal/amendments");
  revalidatePath("/settings/timekeeping");
}
