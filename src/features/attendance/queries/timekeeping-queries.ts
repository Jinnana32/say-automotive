import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type {
  BranchHolidaySummary,
  StaffLeaveEntrySummary,
  StaffLeaveManagementItem,
  TimekeepingCalendarPageData,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";
import type { TableRow } from "@/types/database";

type BranchHolidayRow = TableRow<"branch_holidays">;
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
    { data: holidayData, error: holidayError },
    { data: leaveEntryData, error: leaveEntryError },
    { data: staffData, error: staffError },
  ] = await Promise.all([
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
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
  ]);

  if (holidayError) {
    throw new Error(holidayError.message);
  }

  if (leaveEntryError) {
    throw new Error(leaveEntryError.message);
  }

  if (staffError) {
    throw new Error(staffError.message);
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

  return {
    branchName,
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
