import { getBranchScopedServerClient } from "@/lib/branches";
import type {
  ApprovedLeaveManagementData,
  StaffLeaveManagementItem,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";
import type { TableRow } from "@/types/database";

type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type StaffRow = Pick<
  TableRow<"staff">,
  "id" | "first_name" | "last_name" | "role" | "status"
>;

export async function getApprovedLeaveManagementData(): Promise<ApprovedLeaveManagementData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("attendance:read");
  const branchId = branchScope.selectedBranchId;

  const [{ data: staffData, error: staffError }, { data: leaveEntryData, error: leaveEntryError }] =
    await Promise.all([
      (() => {
        let query = supabase
          .from("staff")
          .select("id, first_name, last_name, role, status")
          .eq("status", "active")
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });

        if (branchId) {
          query = query.eq("branch_id", branchId);
        }

        return query;
      })(),
      (() => {
        let query = supabase
          .from("staff_leave_entries")
          .select("*")
          .order("start_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (branchId) {
          query = query.eq("branch_id", branchId);
        }

        return query;
      })(),
    ]);

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (leaveEntryError) {
    throw new Error(leaveEntryError.message);
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
    activeStaff: staffRows.map(mapStaffOption),
    leaveEntries: ((leaveEntryData ?? []) as StaffLeaveEntryRow[]).map((row) =>
      mapStaffLeaveManagementItem(row, staffById),
    ),
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
    id: row.id,
    branchId: row.branch_id,
    staffId: row.staff_id,
    startDate: row.start_date,
    endDate: row.end_date,
    leaveType: row.leave_type as StaffLeaveManagementItem["leaveType"],
    notes: row.notes,
    staffName: staff?.fullName ?? "Unknown staff member",
    staffRole: staff?.role ?? null,
  };
}
