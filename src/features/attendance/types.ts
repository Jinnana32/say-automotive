import type { StaffRole } from "@/lib/auth/permissions";
import type { Database } from "@/types/database";

export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type AttendanceFilterStatus = AttendanceStatus | "missing_timeout" | "unrecorded";
export type BranchHolidayKind = "regular" | "special" | "branch_closure" | "other";
export type StaffLeaveType = "vacation" | "sick" | "emergency" | "unpaid" | "other";

export type BranchHolidaySummary = {
  id: string;
  branchId: string;
  holidayDate: string;
  label: string;
  holidayKind: BranchHolidayKind;
  notes: string | null;
};

export type StaffLeaveEntrySummary = {
  id: string;
  branchId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: StaffLeaveType;
  notes: string | null;
};

export type StaffScheduleSummary = {
  id: string;
  staffId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  graceMinutes: number;
  mondayIsWorkday: boolean;
  tuesdayIsWorkday: boolean;
  wednesdayIsWorkday: boolean;
  thursdayIsWorkday: boolean;
  fridayIsWorkday: boolean;
  saturdayIsWorkday: boolean;
  sundayIsWorkday: boolean;
  notes: string | null;
};

export type AttendanceDateLockSummary = {
  payrollPeriodId: string;
  payrollPeriodLabel: string;
  payrollPeriodStatus: Database["public"]["Enums"]["payroll_period_status"];
};

export type AttendancePageFilters = {
  date: string;
  search: string;
  role: StaffRole | "";
  status: AttendanceFilterStatus | "";
};

export type AttendanceRecordSummary = {
  id: string;
  attendanceDate: string;
  timeIn: string | null;
  timeOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
  approvedByStaffId: string | null;
  approvedAt: string | null;
};

export type AttendanceRosterItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  schedule: StaffScheduleSummary | null;
  leaveEntry: StaffLeaveEntrySummary | null;
  attendance: AttendanceRecordSummary | null;
  hasMissingTimeout: boolean;
  isApproved: boolean;
};

export type AttendanceDailySummary = {
  totalStaff: number;
  recordedCount: number;
  unrecordedCount: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  approvedCount: number;
  scheduleConfiguredCount: number;
};

export type AttendanceRosterData = {
  filters: AttendancePageFilters;
  branchHoliday: BranchHolidaySummary | null;
  summary: AttendanceDailySummary;
  roster: AttendanceRosterItem[];
  totalMatchingStaff: number;
  visibleCount: number;
  lockedPeriod: AttendanceDateLockSummary | null;
};

export type AttendanceFormValues = {
  staffId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  timeIn: string;
  timeOut: string;
  notes: string;
};

export type StaffScheduleFormValues = {
  staffId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  graceMinutes: string;
  mondayIsWorkday: boolean;
  tuesdayIsWorkday: boolean;
  wednesdayIsWorkday: boolean;
  thursdayIsWorkday: boolean;
  fridayIsWorkday: boolean;
  saturdayIsWorkday: boolean;
  sundayIsWorkday: boolean;
  notes: string;
};

export type BranchHolidayFormValues = {
  holidayId: string;
  holidayDate: string;
  label: string;
  holidayKind: BranchHolidayKind;
  notes: string;
};

export type StaffLeaveFormValues = {
  leaveEntryId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: StaffLeaveType;
  notes: string;
};

export type TimekeepingCalendarStaffOption = {
  id: string;
  fullName: string;
  role: StaffRole;
  status: Database["public"]["Enums"]["record_status"];
};

export type StaffLeaveManagementItem = StaffLeaveEntrySummary & {
  staffName: string;
  staffRole: StaffRole | null;
};

export type TimekeepingCalendarPageData = {
  branchName: string;
  holidays: BranchHolidaySummary[];
  leaveEntries: StaffLeaveManagementItem[];
  activeStaff: TimekeepingCalendarStaffOption[];
};

export type AttendanceEntryActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type TimekeepingActionState = AttendanceEntryActionState;
