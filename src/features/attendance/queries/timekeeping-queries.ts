import { getBranchScopedServerClient } from "@/lib/branches";
import { getServerRequestNetworkContext, normalizePublicIpAddress } from "@/lib/network/request-ip";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AttendanceAccessSettings,
  AttendanceAllowedIpSummary,
  BranchHolidaySummary,
  TimekeepingCalendarPageData,
} from "@/features/attendance/types";
import { getAttendanceDevicesPageData } from "@/features/attendance/queries/attendance-amendment-queries";
import type { TableRow } from "@/types/database";

type BusinessSettingsRow = TableRow<"business_settings">;
type AttendanceAllowedIpRow = TableRow<"attendance_allowed_ips">;
type StaffDeviceRow = Pick<TableRow<"staff_devices">, "staff_id" | "status">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffRow = Pick<TableRow<"staff">, "id">;

export async function getTimekeepingCalendarPageData(): Promise<TimekeepingCalendarPageData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("settings:read");
  const branchId = branchScope.writeBranchId;
  const { requestIp } = await getServerRequestNetworkContext();
  const admin = getSupabaseAdminClient();
  const branchName = branchScope.selectedBranch?.name ?? branchScope.selectedBranchLabel;

  const [
    { data: settingsData, error: settingsError },
    { data: allowedIpData, error: allowedIpError },
    { data: holidayData, error: holidayError },
    { count: pendingAmendmentCount, error: pendingAmendmentError },
    { data: staffData, error: staffError },
    { data: staffDeviceData, error: staffDeviceError },
    devicesReview,
  ] = await Promise.all([
    supabase
      .from("business_settings")
      .select("*")
      .eq("branch_id", branchId)
      .maybeSingle(),
    supabase
      .from("attendance_allowed_ips")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: true }),
    supabase
      .from("branch_holidays")
      .select("*")
      .eq("branch_id", branchId)
      .order("holiday_date", { ascending: true }),
    supabase
      .from("dtr_amendment_requests")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .eq("status", "pending"),
    admin.from("staff").select("id").eq("branch_id", branchId),
    admin.from("staff_devices").select("staff_id, status").order("created_at", { ascending: false }),
    getAttendanceDevicesPageData(),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (allowedIpError) {
    throw new Error(allowedIpError.message);
  }

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (pendingAmendmentError) {
    throw new Error(pendingAmendmentError.message);
  }

  if (staffDeviceError) {
    throw new Error(staffDeviceError.message);
  }

  if (!settingsData) {
    throw new Error("Attendance settings are not configured for the current branch.");
  }

  const branchStaffIds = new Set(((staffData ?? []) as StaffRow[]).map((staffRow) => staffRow.id));
  const pendingDeviceCount = ((staffDeviceData ?? []) as StaffDeviceRow[]).filter(
    (deviceRow) => deviceRow.status === "pending" && branchStaffIds.has(deviceRow.staff_id),
  ).length;

  return {
    branchName,
    attendanceAccessSettings: mapAttendanceAccessSettings(settingsData as BusinessSettingsRow),
    allowedIpAddresses: ((allowedIpData ?? []) as AttendanceAllowedIpRow[]).map(
      mapAllowedAttendanceIp,
    ),
    currentDetectedIp: normalizePublicIpAddress(requestIp),
    observedRequestIp: requestIp,
    pendingAmendmentCount: pendingAmendmentCount ?? 0,
    pendingDeviceCount,
    holidays: ((holidayData ?? []) as BranchHolidayRow[]).map(mapBranchHoliday),
    devicesReview,
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

function mapAttendanceAccessSettings(row: BusinessSettingsRow): AttendanceAccessSettings {
  return {
    requireShopIpForMechanicAttendance: row.require_shop_ip_for_mechanic_attendance,
    allowDtrAmendments: row.allow_dtr_amendments,
    allowAttendanceAdminOverride: row.allow_attendance_admin_override,
  };
}

function mapAllowedAttendanceIp(row: AttendanceAllowedIpRow): AttendanceAllowedIpSummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    ipAddress: row.ip_address,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
