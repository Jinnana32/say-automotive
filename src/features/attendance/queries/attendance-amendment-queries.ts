import { redirect } from "next/navigation";

import { getAuthorizedSupabaseServerClient, requireAuthenticatedStaff } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { getBusinessNow } from "@/lib/dates";
import {
  getServerRequestNetworkContext,
  ipMatchesAllowedList,
} from "@/lib/network/request-ip";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapStaffDevice, resolveMechanicPortalDeviceStatus } from "@/features/attendance/server-device-utils";
import type {
  AttendanceAccessSettings,
  AttendanceAllowedIpSummary,
  AttendanceAmendmentsPageData,
  AttendanceDevicesPageData,
  AttendanceStaffDeviceManagementItem,
  DtrAmendmentSummary,
  MechanicPortalAmendmentsPageData,
  MechanicPortalAttendancePageData,
  MechanicPortalDeviceStatus,
  MechanicPortalIpStatus,
} from "@/features/attendance/types";
import type { TableRow } from "@/types/database";

type BusinessSettingsRow = Pick<
  TableRow<"business_settings">,
  | "allow_attendance_admin_override"
  | "allow_dtr_amendments"
  | "require_shop_ip_for_mechanic_attendance"
>;
type AttendanceAllowedIpRow = TableRow<"attendance_allowed_ips">;
type DtrAmendmentRow = TableRow<"dtr_amendment_requests">;
type AttendanceRow = TableRow<"attendance">;
type StaffNameRow = Pick<TableRow<"staff">, "id" | "first_name" | "last_name" | "role">;
type StaffDeviceRow = TableRow<"staff_devices">;

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

export async function getAttendanceAmendmentsPageData(): Promise<AttendanceAmendmentsPageData> {
  const { context } = await getAuthorizedSupabaseServerClient("attendance:read");
  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  const admin = getSupabaseAdminClient();
  const amendments = await getMappedAmendments({
    admin,
    branchId,
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
  const { context } = await getAuthorizedSupabaseServerClient("attendance:read");
  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  const admin = getSupabaseAdminClient();
  const [deviceResult, branchStaffResult] = await Promise.all([
    admin.from("staff_devices").select("*").order("created_at", { ascending: false }),
    admin
      .from("staff")
      .select("id, first_name, last_name, role")
      .eq("branch_id", branchId),
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
        "require_shop_ip_for_mechanic_attendance, allow_dtr_amendments, allow_attendance_admin_override",
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
}: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  branchId: string;
  staffId?: string;
  limit?: number;
}) {
  let amendmentQuery = admin
    .from("dtr_amendment_requests")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  if (staffId) {
    amendmentQuery = amendmentQuery.eq("staff_id", staffId);
  }

  if (typeof limit === "number") {
    amendmentQuery = amendmentQuery.limit(limit);
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

function mapAttendanceAccessSettings(row: BusinessSettingsRow): AttendanceAccessSettings {
  return {
    requireShopIpForMechanicAttendance: row.require_shop_ip_for_mechanic_attendance,
    allowDtrAmendments: row.allow_dtr_amendments,
    allowAttendanceAdminOverride: row.allow_attendance_admin_override,
  };
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
