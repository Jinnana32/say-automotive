import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getServerRequestNetworkContext } from "@/lib/network/request-ip";
import type {
  AttendanceAccessSettings,
  AttendanceAllowedIpSummary,
  BranchHolidaySummary,
  StaffLeaveEntrySummary,
  StaffLeaveManagementItem,
  TimekeepingCalendarPageData,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";
import type { TableRow } from "@/types/database";

type BusinessSettingsRow = TableRow<"business_settings">;
type AttendanceAllowedIpRow = TableRow<"attendance_allowed_ips">;
type StaffDeviceRow = TableRow<"staff_devices">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type DtrAmendmentRequestRow = Pick<TableRow<"dtr_amendment_requests">, "id">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type StaffRow = Pick<
  TableRow<"staff">,
  "id" | "first_name" | "last_name" | "role" | "status"
>;

export async function getTimekeepingCalendarPageData(): Promise<TimekeepingCalendarPageData> {
  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:read"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const { requestIp } = await getServerRequestNetworkContext();
  let branchName = defaultBranch.name;

  if (branchId !== defaultBranch.id) {
    const { data: branchData, error: branchError } = await supabase
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) {
      throw new Error(branchError.message);
    }

    if (branchData) {
      branchName = branchData.name;
    }
  }

  const [
    { data: settingsData, error: settingsError },
    { data: allowedIpData, error: allowedIpError },
    { data: holidayData, error: holidayError },
    { data: leaveEntryData, error: leaveEntryError },
    { data: staffData, error: staffError },
    { count: pendingAmendmentCount, error: pendingAmendmentError },
    { data: staffDeviceData, error: staffDeviceError },
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
      .from("staff_leave_entries")
      .select("*")
      .eq("branch_id", branchId)
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("staff")
      .select("id, first_name, last_name, role, status")
      .eq("branch_id", branchId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("dtr_amendment_requests")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .eq("status", "pending"),
    supabase.from("staff_devices").select("*").order("created_at", { ascending: false }),
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

  if (leaveEntryError) {
    throw new Error(leaveEntryError.message);
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

  const staffRows = (staffData ?? []) as StaffRow[];
  const staffById = new Map(
    staffRows.map((staffRow) => [
      staffRow.id,
      {
        fullName: `${staffRow.first_name} ${staffRow.last_name}`.trim(),
        role: staffRow.role,
      },
    ]),
  );
  const branchStaffIds = new Set(staffRows.map((staffRow) => staffRow.id));
  const pendingDeviceCount = ((staffDeviceData ?? []) as StaffDeviceRow[]).filter(
    (deviceRow) => deviceRow.status === "pending" && branchStaffIds.has(deviceRow.staff_id),
  ).length;

  return {
    branchName,
    attendanceAccessSettings: mapAttendanceAccessSettings(settingsData as BusinessSettingsRow),
    allowedIpAddresses: ((allowedIpData ?? []) as AttendanceAllowedIpRow[]).map(
      mapAllowedAttendanceIp,
    ),
    currentDetectedIp: requestIp,
    pendingAmendmentCount: pendingAmendmentCount ?? 0,
    pendingDeviceCount,
    holidays: ((holidayData ?? []) as BranchHolidayRow[]).map(mapBranchHoliday),
    leaveEntries: ((leaveEntryData ?? []) as StaffLeaveEntryRow[]).map((row) =>
      mapStaffLeaveManagementItem(row, staffById),
    ),
    activeStaff: staffRows
      .filter((staffRow) => staffRow.status === "active")
      .map(mapStaffOption),
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

function mapStaffOption(row: StaffRow): TimekeepingCalendarStaffOption {
  return {
    id: row.id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    role: row.role,
    status: row.status,
  };
}

function mapStaffLeaveManagementItem(
  row: StaffLeaveEntryRow,
  staffById: Map<string, { fullName: string; role: StaffRow["role"] }>,
): StaffLeaveManagementItem {
  const staff = staffById.get(row.staff_id);

  return {
    ...mapStaffLeaveEntry(row),
    staffName: staff?.fullName ?? "Unknown staff member",
    staffRole: staff?.role ?? null,
  };
}
