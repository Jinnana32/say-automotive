import { redirect } from "next/navigation";
import { DateTime } from "luxon";

import { getAuthorizedSupabaseServerClient, requireAuthenticatedStaff } from "@/lib/auth/session";
import { getBranchScopedServerClient, getDefaultBranch } from "@/lib/branches";
import { getBusinessNow } from "@/lib/dates";
import {
  getServerRequestNetworkContext,
  ipMatchesAllowedList,
} from "@/lib/network/request-ip";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapStaffDevice, resolveMechanicPortalDeviceStatus } from "@/features/attendance/server-device-utils";
import { mapAttendanceAccessSettings } from "@/features/attendance/mappers/access-settings";
import type {
  AttendanceAccessSettings,
  AttendanceAllowedIpSummary,
  AttendanceAmendmentsPageData,
  AttendanceDevicesPageData,
  AttendanceStaffDeviceManagementItem,
  AttendanceTimeLogSummary,
  BranchHolidaySummary,
  DtrAmendmentSummary,
  MechanicPortalAmendmentsPageData,
  MechanicPortalAttendancePageData,
  MechanicPortalDeviceStatus,
  MechanicPortalHistoryCalendarStatus,
  MechanicPortalHistoryDay,
  MechanicPortalHistoryPageData,
  MechanicPortalIpStatus,
  StaffLeaveEntrySummary,
  StaffScheduleSummary,
} from "@/features/attendance/types";
import { doesLeaveCoverDate, isScheduledWorkdayForDate } from "@/features/attendance/utils";
import type { TableRow } from "@/types/database";

type BusinessSettingsRow = Pick<
  TableRow<"business_settings">,
  | "allow_attendance_admin_override"
  | "allow_dtr_amendments"
  | "require_shop_ip_for_mechanic_attendance"
  | "require_shop_location_for_mechanic_attendance"
  | "attendance_geofence_latitude"
  | "attendance_geofence_longitude"
  | "attendance_geofence_radius_meters"
>;
type AttendanceAllowedIpRow = TableRow<"attendance_allowed_ips">;
type DtrAmendmentRow = TableRow<"dtr_amendment_requests">;
type AttendanceRow = TableRow<"attendance">;
type AttendanceTimeLogRow = TableRow<"attendance_time_logs">;
type StaffNameRow = Pick<TableRow<"staff">, "id" | "first_name" | "last_name" | "role">;
type StaffDeviceRow = TableRow<"staff_devices">;
type StaffScheduleRow = TableRow<"staff_schedules">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;

export async function getMechanicPortalAttendancePageData(): Promise<MechanicPortalAttendancePageData> {
  const context = await requireMechanicPortalContext();
  const todayDate = getBusinessNow().toFormat("yyyy-LL-dd");
  const admin = getSupabaseAdminClient();
  const accessContext = await getAttendanceAccessContext({
    admin,
    branchId: context.branchId,
    staffId: context.staffId,
    userId: context.userId,
  });

  const [{ data: attendanceRow, error: attendanceError }, amendmentRows] = await Promise.all([
    admin
      .from("attendance")
      .select("*")
      .eq("staff_id", context.staffId)
      .eq("attendance_date", todayDate)
      .maybeSingle(),
    getMappedAmendments({
      admin,
      branchId: accessContext.branchId,
      staffId: context.staffId,
      limit: 12,
    }),
  ]);

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  return {
    staffId: context.staffId,
    displayName: context.displayName,
    todayDate,
    settings: accessContext.settings,
    ipStatus: accessContext.ipStatus,
    deviceStatus: accessContext.deviceStatus,
    attendance: attendanceRow ? mapAttendanceRecord(attendanceRow as AttendanceRow) : null,
    todayAmendments: amendmentRows.filter((item) => item.attendanceDate === todayDate),
    recentAmendments: amendmentRows,
  };
}

export async function getMechanicPortalAmendmentsPageData(): Promise<MechanicPortalAmendmentsPageData> {
  const context = await requireMechanicPortalContext();
  const admin = getSupabaseAdminClient();
  const accessContext = await getAttendanceAccessContext({
    admin,
    branchId: context.branchId,
    staffId: context.staffId,
    userId: context.userId,
  });
  const amendments = await getMappedAmendments({
    admin,
    branchId: accessContext.branchId,
    staffId: context.staffId,
  });

  return {
    displayName: context.displayName,
    todayDate: getBusinessNow().toFormat("yyyy-LL-dd"),
    settings: accessContext.settings,
    deviceStatus: accessContext.deviceStatus,
    amendments,
  };
}

export async function getMechanicPortalHistoryPageData(
  requestedMonth?: string,
): Promise<MechanicPortalHistoryPageData> {
  const context = await requireMechanicPortalContext();
  const admin = getSupabaseAdminClient();
  const accessContext = await getAttendanceAccessContext({
    admin,
    branchId: context.branchId,
    staffId: context.staffId,
    userId: context.userId,
  });
  const targetMonth = resolvePortalHistoryMonth(requestedMonth);
  const monthStartDate = targetMonth.startOf("month").toFormat("yyyy-LL-dd");
  const monthEndDate = targetMonth.endOf("month").toFormat("yyyy-LL-dd");
  const todayDate = getBusinessNow().toFormat("yyyy-LL-dd");

  const [
    { data: attendanceData, error: attendanceError },
    { data: timeLogData, error: timeLogError },
    { data: scheduleData, error: scheduleError },
    { data: holidayData, error: holidayError },
    { data: leaveData, error: leaveError },
    amendments,
    recentAmendments,
  ] = await Promise.all([
    admin
      .from("attendance")
      .select("*")
      .eq("staff_id", context.staffId)
      .gte("attendance_date", monthStartDate)
      .lte("attendance_date", monthEndDate)
      .order("attendance_date", { ascending: true }),
    admin
      .from("attendance_time_logs")
      .select("*")
      .eq("staff_id", context.staffId)
      .gte("attendance_date", monthStartDate)
      .lte("attendance_date", monthEndDate)
      .order("logged_at", { ascending: true }),
    admin
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", context.staffId)
      .maybeSingle(),
    admin
      .from("branch_holidays")
      .select("*")
      .eq("branch_id", accessContext.branchId)
      .gte("holiday_date", monthStartDate)
      .lte("holiday_date", monthEndDate)
      .order("holiday_date", { ascending: true }),
    admin
      .from("staff_leave_entries")
      .select("*")
      .eq("branch_id", accessContext.branchId)
      .eq("staff_id", context.staffId)
      .lte("start_date", monthEndDate)
      .gte("end_date", monthStartDate)
      .order("start_date", { ascending: true }),
    getMappedAmendments({
      admin,
      branchId: accessContext.branchId,
      staffId: context.staffId,
      startDate: monthStartDate,
      endDate: monthEndDate,
    }),
    getMappedAmendments({
      admin,
      branchId: accessContext.branchId,
      staffId: context.staffId,
      limit: 6,
    }),
  ]);

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  if (timeLogError) {
    throw new Error(timeLogError.message);
  }

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  if (leaveError) {
    throw new Error(leaveError.message);
  }

  const attendanceByDate = new Map(
    ((attendanceData ?? []) as AttendanceRow[]).map((row) => [row.attendance_date, mapAttendanceRecord(row)]),
  );
  const timeLogsByDate = new Map<string, AttendanceTimeLogSummary[]>();

  for (const row of (timeLogData ?? []) as AttendanceTimeLogRow[]) {
    const mapped = mapAttendanceTimeLog(row);
    const existing = timeLogsByDate.get(mapped.attendanceDate) ?? [];
    existing.push(mapped);
    timeLogsByDate.set(mapped.attendanceDate, existing);
  }

  const amendmentsByDate = new Map<string, DtrAmendmentSummary[]>();

  for (const amendment of amendments) {
    const existing = amendmentsByDate.get(amendment.attendanceDate) ?? [];
    existing.push(amendment);
    amendmentsByDate.set(amendment.attendanceDate, existing);
  }

  const schedule = scheduleData ? mapStaffSchedule(scheduleData as StaffScheduleRow) : null;
  const branchHolidays = ((holidayData ?? []) as BranchHolidayRow[]).map((row) =>
    mapBranchHoliday(row),
  );
  const holidayDateSet = new Set(branchHolidays.map((item) => item.holidayDate));
  const leaveEntries = ((leaveData ?? []) as StaffLeaveEntryRow[]).map((row) =>
    mapStaffLeaveEntry(row),
  );

  const days: MechanicPortalHistoryDay[] = [];
  let cursor = targetMonth.startOf("month");
  const monthEnd = targetMonth.endOf("month").startOf("day");

  while (cursor <= monthEnd) {
    const date = cursor.toFormat("yyyy-LL-dd");
    const attendance = attendanceByDate.get(date) ?? null;
    const dayAmendments = amendmentsByDate.get(date) ?? [];
    const timeLogs = timeLogsByDate.get(date) ?? [];
    const isFuture = date > todayDate;
    const isBranchHoliday = holidayDateSet.has(date);
    const leaveEntry = leaveEntries.find((item) => doesLeaveCoverDate(item, date)) ?? null;
    const isScheduledWorkday =
      !isFuture &&
      !isBranchHoliday &&
      leaveEntry === null &&
      isScheduledWorkdayForDate(schedule, date);

    days.push({
      date,
      attendance,
      amendments: dayAmendments,
      timeLogs,
      isFuture,
      isScheduledWorkday,
      isBranchHoliday,
      leaveEntry,
      calendarStatus: deriveMechanicPortalCalendarStatus({
        attendance,
        amendments: dayAmendments,
        isFuture,
        isScheduledWorkday,
      }),
    });

    cursor = cursor.plus({ days: 1 });
  }

  const initialSelectedDate =
    targetMonth.hasSame(DateTime.fromISO(todayDate), "month")
      ? todayDate
      : days.find((item) => item.attendance || item.amendments.length > 0)?.date ?? monthStartDate;

  return {
    displayName: context.displayName,
    todayDate,
    month: targetMonth.toFormat("yyyy-LL"),
    monthLabel: targetMonth.toFormat("LLLL yyyy"),
    monthStartDate,
    monthEndDate,
    initialSelectedDate,
    settings: accessContext.settings,
    schedule,
    branchHolidays,
    days,
    recentAmendments,
  };
}

export async function getAttendanceAmendmentsPageData(): Promise<AttendanceAmendmentsPageData> {
  const { branchScope } = await getBranchScopedServerClient("attendance:read");
  const admin = getSupabaseAdminClient();
  const amendments = await getMappedAmendments({
    admin,
    branchId: branchScope.selectedBranchId,
  });

  return {
    pendingCount: amendments.filter((item) => item.status === "pending").length,
    totalCount: amendments.length,
    amendments: amendments.sort((left, right) => {
      if (left.status === right.status) {
        return right.createdAt.localeCompare(left.createdAt);
      }

      if (left.status === "pending") {
        return -1;
      }

      if (right.status === "pending") {
        return 1;
      }

      return right.createdAt.localeCompare(left.createdAt);
    }),
  };
}

export async function getAttendanceDevicesPageData(): Promise<AttendanceDevicesPageData> {
  const { branchScope } = await getBranchScopedServerClient("attendance:read");
  const branchId = branchScope.selectedBranchId;
  const admin = getSupabaseAdminClient();
  const [deviceResult, branchStaffResult] = await Promise.all([
    admin.from("staff_devices").select("*").order("created_at", { ascending: false }),
    (() => {
      let query = admin
        .from("staff")
        .select("id, first_name, last_name, role");

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      return query;
    })(),
  ]);

  const { data: deviceData, error: deviceError } = deviceResult;

  if (deviceError) {
    throw new Error(deviceError.message);
  }

  if (branchStaffResult.error) {
    throw new Error(branchStaffResult.error.message);
  }

  const deviceRows = ((deviceData ?? []) as StaffDeviceRow[]).filter((row) =>
    Boolean(row.staff_id),
  );
  const staffNameMap = new Map(
    ((branchStaffResult.data ?? []) as StaffNameRow[]).map((row) => [row.id, row]),
  );
  const devices = deviceRows
    .map((row) => mapAttendanceStaffDevice(row, staffNameMap))
    .filter((row) => row !== null)
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt)) as AttendanceStaffDeviceManagementItem[];

  return {
    pendingCount: devices.filter((device) => device.status === "pending").length,
    approvedCount: devices.filter((device) => device.status === "approved").length,
    revokedCount: devices.filter((device) => device.status === "revoked").length,
    devices,
  };
}

export async function getAttendanceAccessContext({
  admin,
  branchId,
  staffId,
  userId,
}: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  branchId: string | null;
  staffId?: string;
  userId?: string | null;
}) {
  const resolvedBranchId = branchId ?? (await getDefaultBranch()).id;
  const [networkContext, settingsResult, allowedIpResult] = await Promise.all([
    getServerRequestNetworkContext(),
    admin
      .from("business_settings")
      .select(
        "require_shop_ip_for_mechanic_attendance, require_shop_location_for_mechanic_attendance, attendance_geofence_latitude, attendance_geofence_longitude, attendance_geofence_radius_meters, allow_dtr_amendments, allow_attendance_admin_override",
      )
      .eq("branch_id", resolvedBranchId)
      .single(),
    admin
      .from("attendance_allowed_ips")
      .select("*")
      .eq("branch_id", resolvedBranchId)
      .order("created_at", { ascending: true }),
  ]);

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  if (allowedIpResult.error) {
    throw new Error(allowedIpResult.error.message);
  }

  const settings = mapAttendanceAccessSettings(
    settingsResult.data as BusinessSettingsRow,
  );
  const allowedIps = (allowedIpResult.data ?? []) as AttendanceAllowedIpRow[];
  const matchedAllowedIp = allowedIps.find((allowedIp) =>
    Boolean(
      networkContext.requestIp
        ? ipMatchesAllowedList(networkContext.requestIp, [
            {
              ipAddress: allowedIp.ip_address,
            },
          ])
        : false,
    ),
  );
  const deviceStatus = staffId
    ? await resolveMechanicPortalDeviceStatus({
        admin,
        staffId,
        requestIp: networkContext.requestIp,
        userAgent: networkContext.userAgent,
        userIdForAudit: userId ?? null,
      })
    : ({
        status: "missing",
        hasDeviceToken: false,
        isApproved: false,
        currentDevice: null,
      } satisfies MechanicPortalDeviceStatus);

  return {
    branchId: resolvedBranchId,
    settings,
    ipStatus: {
      requestIp: networkContext.requestIp,
      isShopIpRequired: settings.requireShopIpForMechanicAttendance,
      isAllowed:
        !settings.requireShopIpForMechanicAttendance || Boolean(matchedAllowedIp),
      matchedAllowedIp: matchedAllowedIp ? mapAllowedIp(matchedAllowedIp) : null,
    } satisfies MechanicPortalIpStatus,
    deviceStatus,
    requestUserAgent: networkContext.userAgent,
  };
}

async function getMappedAmendments({
  admin,
  branchId,
  staffId,
  limit,
  startDate,
  endDate,
}: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  branchId?: string | null;
  staffId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  let amendmentQuery = admin
    .from("dtr_amendment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (branchId) {
    amendmentQuery = amendmentQuery.eq("branch_id", branchId);
  }

  if (staffId) {
    amendmentQuery = amendmentQuery.eq("staff_id", staffId);
  }

  if (typeof limit === "number") {
    amendmentQuery = amendmentQuery.limit(limit);
  }

  if (startDate) {
    amendmentQuery = amendmentQuery.gte("attendance_date", startDate);
  }

  if (endDate) {
    amendmentQuery = amendmentQuery.lte("attendance_date", endDate);
  }

  const { data: amendmentData, error: amendmentError } = await amendmentQuery;

  if (amendmentError) {
    throw new Error(amendmentError.message);
  }

  const amendmentRows = (amendmentData ?? []) as DtrAmendmentRow[];
  const relatedStaffIds = collectRelatedStaffIds(amendmentRows);
  const staffNameMap = await getStaffNameMap(admin, relatedStaffIds);

  return amendmentRows.map((row) => mapDtrAmendmentSummary(row, staffNameMap));
}

async function getStaffNameMap(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  staffIds: string[],
) {
  if (staffIds.length === 0) {
    return new Map<string, StaffNameRow>();
  }

  const { data, error } = await admin
    .from("staff")
    .select("id, first_name, last_name, role")
    .in("id", staffIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as StaffNameRow[]).map((row) => [row.id, row]),
  );
}

function collectRelatedStaffIds(rows: DtrAmendmentRow[]) {
  return Array.from(
    new Set(
      rows.flatMap((row) =>
        [row.staff_id, row.approved_by_staff_id, row.rejected_by_staff_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  );
}


function mapAllowedIp(row: AttendanceAllowedIpRow): AttendanceAllowedIpSummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    ipAddress: row.ip_address,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function mapAttendanceTimeLog(row: AttendanceTimeLogRow): AttendanceTimeLogSummary {
  return {
    id: row.id,
    staffId: row.staff_id,
    attendanceId: row.attendance_id,
    amendmentId: row.dtr_amendment_id,
    staffDeviceId: row.staff_device_id,
    attendanceDate: row.attendance_date,
    logType: row.log_type as AttendanceTimeLogSummary["logType"],
    loggedAt: row.logged_at,
    source: row.source as AttendanceTimeLogSummary["source"],
    requestIp: row.request_ip,
    isShopIpValid: row.is_shop_ip_valid,
    requestLatitude: row.request_latitude,
    requestLongitude: row.request_longitude,
    locationAccuracyMeters: row.location_accuracy_meters,
    isLocationValid: row.is_location_valid,
    isDeviceApproved: row.is_device_approved,
    userAgent: row.user_agent,
    createdAt: row.created_at,
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
    payTreatment: row.pay_treatment as BranchHolidaySummary["payTreatment"],
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

function mapAttendanceStaffDevice(
  row: StaffDeviceRow,
  staffNameMap: Map<string, StaffNameRow>,
) {
  const staff = staffNameMap.get(row.staff_id);

  if (!staff) {
    return null;
  }

  return {
    ...mapStaffDevice(row),
    staffName: `${staff.first_name} ${staff.last_name}`.trim(),
    staffRole: staff.role,
  };
}

function mapDtrAmendmentSummary(
  row: DtrAmendmentRow,
  staffNameMap: Map<string, StaffNameRow>,
): DtrAmendmentSummary {
  const requestStaff = staffNameMap.get(row.staff_id);
  const approvedByStaff = row.approved_by_staff_id
    ? staffNameMap.get(row.approved_by_staff_id)
    : undefined;
  const rejectedByStaff = row.rejected_by_staff_id
    ? staffNameMap.get(row.rejected_by_staff_id)
    : undefined;

  return {
    id: row.id,
    branchId: row.branch_id,
    staffId: row.staff_id,
    staffName: requestStaff
      ? `${requestStaff.first_name} ${requestStaff.last_name}`.trim()
      : "Unknown staff",
    staffRole: requestStaff?.role ?? "mechanic",
    attendanceId: row.attendance_id,
    attendanceDate: row.attendance_date,
    targetLogType: row.target_log_type as DtrAmendmentSummary["targetLogType"],
    amendmentType: row.amendment_type as DtrAmendmentSummary["amendmentType"],
    requestedTimestamp: row.requested_timestamp,
    reason: row.reason,
    proofUrl: row.proof_url,
    status: row.status as DtrAmendmentSummary["status"],
    requestedIp: row.requested_ip,
    requestUserAgent: row.request_user_agent,
    approvedTimestamp: row.approved_timestamp,
    approvedByStaffId: row.approved_by_staff_id,
    approvedByName: approvedByStaff
      ? `${approvedByStaff.first_name} ${approvedByStaff.last_name}`.trim()
      : null,
    rejectedAt: row.rejected_at,
    rejectedByStaffId: row.rejected_by_staff_id,
    rejectedByName: rejectedByStaff
      ? `${rejectedByStaff.first_name} ${rejectedByStaff.last_name}`.trim()
      : null,
    finalTimestamp: row.final_timestamp,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireMechanicPortalContext() {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "mechanic") {
    redirect("/dashboard");
  }

  return context;
}

function resolvePortalHistoryMonth(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const parsed = DateTime.fromFormat(value, "yyyy-LL");

    if (parsed.isValid) {
      return parsed.startOf("month");
    }
  }

  return getBusinessNow().startOf("month");
}

function deriveMechanicPortalCalendarStatus({
  attendance,
  amendments,
  isFuture,
  isScheduledWorkday,
}: {
  attendance: ReturnType<typeof mapAttendanceRecord> | null;
  amendments: DtrAmendmentSummary[];
  isFuture: boolean;
  isScheduledWorkday: boolean;
}): MechanicPortalHistoryCalendarStatus {
  if (isFuture) {
    return "none";
  }

  if (amendments.some((item) => item.status === "pending")) {
    return "incomplete";
  }

  if (attendance) {
    if (attendance.status === "unpaid_day_off" && !attendance.timeIn && !attendance.timeOut) {
      return "none";
    }

    if (attendance.status === "absent" && !attendance.timeIn && !attendance.timeOut) {
      return "absent";
    }

    return attendance.timeIn && attendance.timeOut ? "present" : "incomplete";
  }

  return isScheduledWorkday ? "absent" : "none";
}
