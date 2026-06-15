import type { StaffRole } from "@/lib/auth/permissions";
import type { PrintDocumentBusinessProfile } from "@/components/reports/print-document-page";
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
  isPayrollEligible: boolean;
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
};

export type PayrollDashboardSummary = {
  eligibleStaffCount: number;
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
  generatedByStaffId: string | null;
  generatedAt: string | null;
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
  warningStaffCount: number;
  missingScheduleCount: number;
  missingCompensationCount: number;
  missingAttendanceCount: number;
  openShiftCount: number;
  pendingApprovalCount: number;
  totalWorkedMinutes: number;
  totalBasePay: number;
  totalLateDeductions: number;
  totalHolidayPremiumPay: number;
  totalOvertimePay: number;
  totalAllowancePay: number;
  totalGrossPay: number;
  totalNetPay: number;
};

export type PayrollPeriodAdjustmentType = "addition" | "deduction";

export type PayrollWarningCode =
  | "missing_schedule"
  | "missing_compensation"
  | "missing_attendance"
  | "needs_dtr_completion"
  | "not_configured"
  | "pending_approval"
  | "custom_holiday_rule";

export type PayrollPeriodItemAdjustmentSummary = {
  id: string;
  payrollPeriodItemId: string;
  adjustmentType: PayrollPeriodAdjustmentType;
  label: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPeriodItemSummary = {
  id: string;
  payrollPeriodId: string;
  branchId: string;
  staffId: string;
  fullName: string;
  role: StaffRole;
  payBasis: PayBasis | null;
  baseRate: number | null;
  overtimeRate: number | null;
  allowancePerPeriod: number;
  dailyRateUsed: number;
  hourlyRateUsed: number;
  standardDailyHours: number;
  holidayPremiumRate: number;
  scheduledWorkdayCount: number;
  holidayDayCount: number;
  approvedLeaveDayCount: number;
  expectedWorkdayCount: number;
  missingAttendanceDayCount: number;
  recordedDayCount: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  pendingApprovalCount: number;
  workedMinutes: number;
  paidDayUnits: number;
  holidayWorkedDayUnits: number;
  lateDeductionMinutes: number;
  overtimeMinutes: number;
  basePay: number;
  lateDeductionAmount: number;
  holidayPremiumPay: number;
  overtimePay: number;
  allowancePay: number;
  computedPay: number;
  manualAdditionsTotal: number;
  manualDeductionsTotal: number;
  grossPay: number;
  netPay: number;
  readinessStatus: PayrollStaffReadinessStatus;
  warningCodes: PayrollWarningCode[];
  adjustments: PayrollPeriodItemAdjustmentSummary[];
};

export type PayrollSettingsSummary = {
  standardDailyHours: number;
  holidayPremiumRate: number;
};

export type PayrollPeriodDetailData = {
  period: PayrollPeriodSummary;
  settings: PayrollSettingsSummary;
  summary: PayrollPeriodDetailSummary;
  items: PayrollPeriodItemSummary[];
};

export type PayrollPrintDocument = PayrollPeriodDetailData & {
  businessProfile: PrintDocumentBusinessProfile;
  generatedAt: string;
};

export type PayrollAttendanceSourceRecord = {
  attendanceDate: string;
  status: Database["public"]["Enums"]["attendance_status"];
  timeIn: string | null;
  timeOut: string | null;
  approvedAt: string | null;
};

export type PayrollAdjustmentFormValues = {
  payrollPeriodId: string;
  payrollPeriodItemId: string;
  adjustmentType: PayrollPeriodAdjustmentType;
  label: string;
  amount: string;
  notes: string;
};
