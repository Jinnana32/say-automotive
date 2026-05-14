import type { StaffRole } from "@/lib/auth/permissions";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import type { Database } from "@/types/database";

export type PayBasis = Database["public"]["Enums"]["pay_basis"];
export type PayrollPeriodStatus = Database["public"]["Enums"]["payroll_period_status"];

export type PayrollPageFilters = {
  periodSearch: string;
  staffSearch: string;
  periodStatus: PayrollPeriodStatus | "";
};

export type CompensationProfileSummary = {
  id: string;
  staffId: string;
  payBasis: PayBasis;
  baseRate: number;
  overtimeRate: number | null;
  allowancePerPeriod: number;
  effectiveStartDate: string;
  notes: string | null;
};

export type PayrollCompensationRosterItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
};

export type PayrollDashboardSummary = {
  activeStaffCount: number;
  compensatedStaffCount: number;
  missingCompensationCount: number;
  scheduledStaffCount: number;
  missingScheduleCount: number;
  payrollPeriodCount: number;
  draftPeriodCount: number;
  processingPeriodCount: number;
  finalizedPeriodCount: number;
};

export type PayrollPeriodSummary = {
  id: string;
  branchId: string;
  label: string;
  periodStartDate: string;
  periodEndDate: string;
  payoutDate: string;
  status: PayrollPeriodStatus;
  notes: string | null;
  createdByStaffId: string | null;
  finalizedByStaffId: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPageData = {
  filters: PayrollPageFilters;
  summary: PayrollDashboardSummary;
  payrollPeriods: PayrollPeriodSummary[];
  compensationRoster: PayrollCompensationRosterItem[];
  totalCompensationRosterCount: number;
  visibleCompensationRosterCount: number;
};

export type CompensationProfileFormValues = {
  staffId: string;
  payBasis: PayBasis;
  baseRate: string;
  overtimeRate: string;
  allowancePerPeriod: string;
  effectiveStartDate: string;
  notes: string;
};

export type PayrollPeriodFormValues = {
  label: string;
  periodStartDate: string;
  periodEndDate: string;
  payoutDate: string;
  notes: string;
};

export type PayrollPeriodStatusFormValues = {
  periodId: string;
  status: PayrollPeriodStatus;
};

export type PayrollFormActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type PayrollStaffReadinessStatus =
  | "ready"
  | "missing_schedule"
  | "missing_compensation"
  | "missing_attendance"
  | "needs_dtr_completion"
  | "configured_no_activity"
  | "not_configured";

export type PayrollPeriodStaffSummary = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  schedule: StaffScheduleSummary | null;
  compensationProfile: CompensationProfileSummary | null;
  hadAttendanceActivity: boolean;
  isBlocked: boolean;
  readinessStatus: PayrollStaffReadinessStatus;
  scheduledWorkdayCount: number;
  holidayDayCount: number;
  approvedLeaveDayCount: number;
  expectedWorkdayCount: number;
  missingAttendanceDayCount: number;
  recordedDays: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  approvedCount: number;
  pendingApprovalCount: number;
  workedMinutes: number;
};

export type PayrollPeriodDetailSummary = {
  totalStaffCount: number;
  staffWithActivityCount: number;
  configuredStaffCount: number;
  scheduledStaffCount: number;
  readyStaffCount: number;
  blockedStaffCount: number;
  missingScheduleCount: number;
  missingCompensationCount: number;
  missingAttendanceCount: number;
  openShiftCount: number;
  pendingApprovalCount: number;
  totalWorkedMinutes: number;
};

export type PayrollPeriodDetailData = {
  period: PayrollPeriodSummary;
  summary: PayrollPeriodDetailSummary;
  staffSummaries: PayrollPeriodStaffSummary[];
};

export type PayrollAttendanceSourceRecord = {
  status: Database["public"]["Enums"]["attendance_status"];
  timeIn: string | null;
  timeOut: string | null;
  approvedAt: string | null;
};
