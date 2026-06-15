import { notFound } from "next/navigation";

import type { StaffScheduleSummary } from "@/features/attendance/types";
import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type {
  CompensationProfileSummary,
  PayrollCompensationRosterItem,
  PayrollPageData,
  PayrollPageFilters,
  PayrollPeriodDetailData,
  PayrollPeriodDetailSummary,
  PayrollPeriodItemAdjustmentSummary,
  PayrollPeriodItemSummary,
  PayrollPeriodSummary,
  PayrollWarningCode,
} from "@/features/payroll/types";
import type { TableRow } from "@/types/database";

type StaffRow = Pick<
  TableRow<"staff">,
  | "id"
  | "first_name"
  | "last_name"
  | "role"
  | "contact_number"
  | "status"
  | "is_payroll_eligible"
>;
type CompensationRow = TableRow<"staff_compensation_profiles">;
type PayrollPeriodRow = TableRow<"payroll_periods">;
type PayrollPeriodItemRow = TableRow<"payroll_period_items">;
type PayrollPeriodItemAdjustmentRow = TableRow<"payroll_period_item_adjustments">;
type StaffScheduleRow = TableRow<"staff_schedules">;
type BusinessSettingsRow = TableRow<"business_settings">;

export async function getPayrollPageData(filters: PayrollPageFilters): Promise<PayrollPageData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("payroll:read");
  const [{ data: staffData, error: staffError }, { data: periodData, error: periodError }] =
    await Promise.all([
      applyBranchFilter(
        supabase
          .from("staff")
          .select(
            "id, first_name, last_name, role, contact_number, status, is_payroll_eligible",
          )
          .eq("status", "active")
          .eq("is_payroll_eligible", true)
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true }),
        branchScope.selectedBranchId,
      ),
      applyBranchFilter(
        supabase
          .from("payroll_periods")
          .select("*")
          .order("period_start_date", { ascending: false })
          .order("created_at", { ascending: false }),
        branchScope.selectedBranchId,
      ),
    ]);

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (periodError) {
    throw new Error(periodError.message);
  }

  const staffRows = (staffData ?? []) as StaffRow[];
  const staffIds = staffRows.map((staffMember) => staffMember.id);
  let compensationRows: CompensationRow[] = [];
  let scheduleRows: StaffScheduleRow[] = [];

  if (staffIds.length > 0) {
    const [
      { data: compensationData, error: compensationError },
      { data: scheduleData, error: scheduleError },
    ] = await Promise.all([
      supabase.from("staff_compensation_profiles").select("*").in("staff_id", staffIds),
      supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
    ]);

    if (compensationError) {
      throw new Error(compensationError.message);
    }

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }

    compensationRows = (compensationData ?? []) as CompensationRow[];
    scheduleRows = (scheduleData ?? []) as StaffScheduleRow[];
  }

  const compensationByStaffId = new Map(
    compensationRows.map((row) => [row.staff_id, mapCompensationProfile(row)]),
  );
  const scheduleByStaffId = new Map(
    scheduleRows.map((row) => [row.staff_id, mapStaffSchedule(row)]),
  );
  const payrollPeriods = ((periodData ?? []) as PayrollPeriodRow[]).map(mapPayrollPeriod);
  const periodSearch = filters.periodSearch.trim().toLowerCase();
  const filteredPeriods = payrollPeriods.filter((period) => {
    if (filters.periodStatus && period.status !== filters.periodStatus) {
      return false;
    }

    if (!periodSearch) {
      return true;
    }

    return [
      period.label,
      period.notes ?? "",
      period.periodStartDate,
      period.periodEndDate,
      period.payoutDate,
    ]
      .join(" ")
      .toLowerCase()
      .includes(periodSearch);
  });
  const compensationRosterBase = staffRows.map<PayrollCompensationRosterItem>((staffMember) => ({
    staffId: staffMember.id,
    fullName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
    role: staffMember.role,
    contactNumber: staffMember.contact_number,
    isPayrollEligible: staffMember.is_payroll_eligible,
    schedule: scheduleByStaffId.get(staffMember.id) ?? null,
    profile: compensationByStaffId.get(staffMember.id) ?? null,
  }));
  const compensationSearch = filters.staffSearch.trim().toLowerCase();
  const filteredCompensationRoster = compensationSearch
    ? compensationRosterBase.filter((item) => {
        const haystacks = [item.fullName, item.contactNumber ?? "", item.role.replaceAll("_", " ")];
        return haystacks.some((value) => value.toLowerCase().includes(compensationSearch));
      })
    : compensationRosterBase;

  return {
    filters,
    summary: {
      eligibleStaffCount: staffRows.length,
      compensatedStaffCount: compensationRows.length,
      missingCompensationCount: Math.max(staffRows.length - compensationRows.length, 0),
      scheduledStaffCount: scheduleRows.length,
      missingScheduleCount: Math.max(staffRows.length - scheduleRows.length, 0),
      payrollPeriodCount: payrollPeriods.length,
      draftPeriodCount: payrollPeriods.filter((period) => period.status === "draft").length,
      processingPeriodCount: payrollPeriods.filter((period) => period.status === "processing").length,
      finalizedPeriodCount: payrollPeriods.filter((period) => period.status === "finalized").length,
    },
    payrollPeriods: filteredPeriods,
    compensationRoster: filteredCompensationRoster,
    totalCompensationRosterCount: compensationRosterBase.length,
    visibleCompensationRosterCount: filteredCompensationRoster.length,
  };
}

export async function getPayrollPeriodDetailData(periodId: string): Promise<PayrollPeriodDetailData> {
  const { branchScope, supabase } = await getBranchScopedServerClient("payroll:read");
  const { data: periodData, error: periodError } = await applyBranchFilter(
    supabase.from("payroll_periods").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", periodId)
    .maybeSingle();

  if (periodError) {
    throw new Error(periodError.message);
  }

  if (!periodData) {
    notFound();
  }

  const period = mapPayrollPeriod(periodData as PayrollPeriodRow);
  const [{ data: itemData, error: itemError }, { data: settingsData, error: settingsError }] =
    await Promise.all([
    supabase
      .from("payroll_period_items")
      .select("*")
      .eq("payroll_period_id", period.id)
      .order("net_pay", { ascending: false })
      .order("staff_name", { ascending: true }),
    supabase
      .from("business_settings")
      .select("payroll_standard_daily_hours, payroll_holiday_premium_rate")
      .eq("branch_id", period.branchId)
      .single(),
    ]);

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const itemIds = ((itemData ?? []) as PayrollPeriodItemRow[]).map((row) => row.id);
  let adjustmentRows: PayrollPeriodItemAdjustmentRow[] = [];

  if (itemIds.length > 0) {
    const { data: adjustmentData, error: adjustmentError } = await supabase
      .from("payroll_period_item_adjustments")
      .select("*")
      .in("payroll_period_item_id", itemIds);

    if (adjustmentError) {
      throw new Error(adjustmentError.message);
    }

    adjustmentRows = (adjustmentData ?? []) as PayrollPeriodItemAdjustmentRow[];
  }

  const adjustmentsByItemId = new Map<string, PayrollPeriodItemAdjustmentSummary[]>();

  for (const row of adjustmentRows) {
    const existing = adjustmentsByItemId.get(row.payroll_period_item_id) ?? [];
    existing.push(mapPayrollAdjustment(row));
    adjustmentsByItemId.set(row.payroll_period_item_id, existing);
  }

  const items = ((itemData ?? []) as PayrollPeriodItemRow[])
    .map((row) => mapPayrollPeriodItem(row, adjustmentsByItemId.get(row.id) ?? []))
    .sort((leftItem, rightItem) => {
      const leftWarnings = leftItem.warningCodes.length;
      const rightWarnings = rightItem.warningCodes.length;

      if (leftWarnings !== rightWarnings) {
        return rightWarnings - leftWarnings;
      }

      return leftItem.fullName.localeCompare(rightItem.fullName);
    });

  const summary = items.reduce<PayrollPeriodDetailSummary>(
    (currentSummary, item) => {
      currentSummary.totalStaffCount += 1;
      currentSummary.totalWorkedMinutes += item.workedMinutes;
      currentSummary.totalBasePay += item.basePay;
      currentSummary.totalLateDeductions += item.lateDeductionAmount;
      currentSummary.totalHolidayPremiumPay += item.holidayPremiumPay;
      currentSummary.totalOvertimePay += item.overtimePay;
      currentSummary.totalAllowancePay += item.allowancePay;
      currentSummary.totalGrossPay += item.grossPay;
      currentSummary.totalNetPay += item.netPay;

      if (item.warningCodes.length > 0) {
        currentSummary.warningStaffCount += 1;
      }

      if (item.warningCodes.includes("missing_schedule")) {
        currentSummary.missingScheduleCount += 1;
      }

      if (
        item.warningCodes.includes("missing_compensation") ||
        item.warningCodes.includes("not_configured")
      ) {
        currentSummary.missingCompensationCount += 1;
      }

      if (item.warningCodes.includes("missing_attendance")) {
        currentSummary.missingAttendanceCount += 1;
      }

      if (item.missingTimeoutCount > 0) {
        currentSummary.openShiftCount += 1;
      }

      currentSummary.pendingApprovalCount += item.pendingApprovalCount;

      return currentSummary;
    },
    {
      totalStaffCount: 0,
      warningStaffCount: 0,
      missingScheduleCount: 0,
      missingCompensationCount: 0,
      missingAttendanceCount: 0,
      openShiftCount: 0,
      pendingApprovalCount: 0,
      totalWorkedMinutes: 0,
      totalBasePay: 0,
      totalLateDeductions: 0,
      totalHolidayPremiumPay: 0,
      totalOvertimePay: 0,
      totalAllowancePay: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
    },
  );

  return {
    period,
    settings: {
      standardDailyHours: (settingsData as BusinessSettingsRow).payroll_standard_daily_hours ?? 8,
      holidayPremiumRate: (settingsData as BusinessSettingsRow).payroll_holiday_premium_rate ?? 0.3,
    },
    summary,
    items,
  };
}

function mapCompensationProfile(row: CompensationRow): CompensationProfileSummary {
  return {
    id: row.id,
    staffId: row.staff_id,
    payBasis: row.pay_basis,
    baseRate: row.base_rate,
    overtimeRate: row.overtime_rate,
    allowancePerPeriod: row.allowance_per_period,
    effectiveStartDate: row.effective_start_date,
    notes: row.notes,
  };
}

function mapPayrollPeriod(row: PayrollPeriodRow): PayrollPeriodSummary {
  return {
    id: row.id,
    branchId: row.branch_id,
    label: row.label,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    payoutDate: row.payout_date,
    status: row.status,
    notes: row.notes,
    createdByStaffId: row.created_by_staff_id,
    generatedByStaffId: row.generated_by_staff_id,
    generatedAt: row.generated_at,
    finalizedByStaffId: row.finalized_by_staff_id,
    finalizedAt: row.finalized_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function mapPayrollAdjustment(row: PayrollPeriodItemAdjustmentRow): PayrollPeriodItemAdjustmentSummary {
  return {
    id: row.id,
    payrollPeriodItemId: row.payroll_period_item_id,
    adjustmentType: row.adjustment_type as PayrollPeriodItemAdjustmentSummary["adjustmentType"],
    label: row.label,
    amount: row.amount,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPayrollPeriodItem(
  row: PayrollPeriodItemRow,
  adjustments: PayrollPeriodItemAdjustmentSummary[],
): PayrollPeriodItemSummary {
  return {
    id: row.id,
    payrollPeriodId: row.payroll_period_id,
    branchId: row.branch_id,
    staffId: row.staff_id,
    fullName: row.staff_name,
    role: row.staff_role,
    payBasis: row.pay_basis,
    baseRate: row.base_rate,
    overtimeRate: row.overtime_rate,
    allowancePerPeriod: row.allowance_per_period,
    dailyRateUsed: row.daily_rate_used,
    hourlyRateUsed: row.hourly_rate_used,
    standardDailyHours: row.standard_daily_hours,
    holidayPremiumRate: row.holiday_premium_rate,
    scheduledWorkdayCount: row.scheduled_workday_count,
    holidayDayCount: row.holiday_day_count,
    approvedLeaveDayCount: row.approved_leave_day_count,
    expectedWorkdayCount: row.expected_workday_count,
    missingAttendanceDayCount: row.missing_attendance_day_count,
    recordedDayCount: row.recorded_day_count,
    presentCount: row.present_count,
    lateCount: row.late_count,
    halfDayCount: row.half_day_count,
    absentCount: row.absent_count,
    missingTimeoutCount: row.missing_timeout_count,
    pendingApprovalCount: row.pending_approval_count,
    workedMinutes: row.worked_minutes,
    paidDayUnits: row.paid_day_units,
    holidayWorkedDayUnits: row.holiday_worked_day_units,
    lateDeductionMinutes: row.late_deduction_minutes,
    overtimeMinutes: row.overtime_minutes,
    basePay: row.base_pay,
    lateDeductionAmount: row.late_deduction_amount,
    holidayPremiumPay: row.holiday_premium_pay,
    overtimePay: row.overtime_pay,
    allowancePay: row.allowance_pay,
    computedPay: row.computed_pay,
    manualAdditionsTotal: row.manual_additions_total,
    manualDeductionsTotal: row.manual_deductions_total,
    grossPay: row.gross_pay,
    netPay: row.net_pay,
    readinessStatus: row.readiness_status as PayrollPeriodItemSummary["readinessStatus"],
    warningCodes: (row.warning_codes ?? []) as PayrollWarningCode[],
    adjustments,
  };
}
