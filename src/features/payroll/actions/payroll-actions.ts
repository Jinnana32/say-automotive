"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getBranchScopedServerClient, requireBranchAccess } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import type { StaffLeaveEntrySummary } from "@/features/attendance/types";
import {
  computePayrollItem,
  summarizeAdjustmentTotals,
  type PayrollHolidayRule,
} from "@/features/payroll/calculations";
import {
  compensationProfileSchema,
  parseCompensationProfileFormData,
  parsePayrollAdjustmentFormData,
  parsePayrollPeriodFormData,
  parsePayrollPeriodStatusFormData,
  payrollAdjustmentSchema,
  payrollPeriodSchema,
  payrollPeriodStatusSchema,
} from "@/features/payroll/schemas/payroll-schemas";
import type { PayrollFormActionState } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";
import type { TableInsert, TableRow } from "@/types/database";

type StaffScheduleRow = TableRow<"staff_schedules">;
type BranchHolidayRow = TableRow<"branch_holidays">;
type StaffLeaveEntryRow = TableRow<"staff_leave_entries">;
type AttendanceRow = Pick<
  TableRow<"attendance">,
  "staff_id" | "status" | "time_in" | "time_out" | "approved_at" | "attendance_date"
>;

const periodIdSchema = z.object({
  periodId: z.string().uuid("Select a payroll period."),
});

const deleteAdjustmentSchema = z.object({
  adjustmentId: z.string().uuid("Select a payroll adjustment."),
  payrollPeriodId: z.string().uuid("Select a payroll period."),
});

type StaffSavePayload = Pick<
  TableInsert<"staff_compensation_profiles">,
  | "staff_id"
  | "pay_basis"
  | "base_rate"
  | "overtime_rate"
  | "allowance_per_period"
  | "effective_start_date"
  | "notes"
>;

export async function upsertCompensationProfileAction(
  _prevState: PayrollFormActionState = INITIAL_PAYROLL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const parsed = compensationProfileSchema.safeParse(parseCompensationProfileFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { supabase } = await getBranchScopedServerClient("payroll:write");
  const payload: StaffSavePayload = {
    staff_id: values.staffId,
    pay_basis: values.payBasis,
    base_rate: Number(values.baseRate),
    overtime_rate: values.overtimeRate.trim() ? Number(values.overtimeRate) : null,
    allowance_per_period: Number(values.allowancePerPeriod),
    effective_start_date: values.effectiveStartDate,
    notes: normalizeNullable(values.notes),
  };
  const { error } = await supabase.from("staff_compensation_profiles").upsert(payload, {
    onConflict: "staff_id",
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePayrollPaths();

  return {
    status: "success",
    message: "Compensation profile saved.",
  };
}

export async function createPayrollPeriodAction(
  _prevState: PayrollFormActionState = INITIAL_PAYROLL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const parsed = payrollPeriodSchema.safeParse(parsePayrollPeriodFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { branchScope, context, supabase } = await getBranchScopedServerClient("payroll:write");
  const branchId = branchScope.writeBranchId;
  const { error } = await supabase.from("payroll_periods").insert({
    branch_id: branchId,
    label: values.label,
    period_start_date: values.periodStartDate,
    period_end_date: values.periodEndDate,
    payout_date: values.payoutDate,
    status: "draft",
    notes: normalizeNullable(values.notes),
    created_by_staff_id: context.staffId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePayrollPaths();

  return {
    status: "success",
    message: "Payroll period created.",
  };
}

export async function generatePayrollCutAction(
  _prevState: PayrollFormActionState = INITIAL_PAYROLL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const parsed = periodIdSchema.safeParse({
    periodId: readString(formData, "periodId"),
  });

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const { periodId } = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("payroll:write");
  const { data: periodData, error: periodError } = await supabase
    .from("payroll_periods")
    .select("id, branch_id, label, period_start_date, period_end_date, status")
    .eq("id", periodId)
    .maybeSingle();

  if (periodError) {
    return { status: "error", message: periodError.message };
  }

  if (!periodData) {
    return { status: "error", message: "Payroll period not found." };
  }

  await requireBranchAccess(periodData.branch_id);

  if (periodData.status === "finalized") {
    return {
      status: "error",
      message: "Finalized payroll periods are locked.",
    };
  }

  const [
    { data: settingsData, error: settingsError },
    { data: staffData, error: staffError },
    { data: holidayData, error: holidayError },
    { data: existingItemsData, error: existingItemsError },
  ] = await Promise.all([
    supabase
      .from("business_settings")
      .select("payroll_standard_daily_hours, payroll_holiday_premium_rate")
      .eq("branch_id", periodData.branch_id)
      .single(),
    supabase
      .from("staff")
      .select("id, first_name, last_name, role")
      .eq("branch_id", periodData.branch_id)
      .eq("status", "active")
      .eq("is_payroll_eligible", true)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("branch_holidays")
      .select("holiday_date, holiday_kind, pay_treatment")
      .eq("branch_id", periodData.branch_id)
      .gte("holiday_date", periodData.period_start_date)
      .lte("holiday_date", periodData.period_end_date),
    supabase
      .from("payroll_period_items")
      .select("id, staff_id")
      .eq("payroll_period_id", periodData.id),
  ]);

  if (settingsError) {
    return { status: "error", message: settingsError.message };
  }

  if (staffError) {
    return { status: "error", message: staffError.message };
  }

  if (holidayError) {
    return { status: "error", message: holidayError.message };
  }

  if (existingItemsError) {
    return { status: "error", message: existingItemsError.message };
  }

  const staffRows = staffData ?? [];
  const staffIds = staffRows.map((row) => row.id);

  if (staffIds.length === 0) {
    return {
      status: "error",
      message: "No payroll-eligible staff were found for this branch.",
    };
  }

  const [
    { data: compensationData, error: compensationError },
    { data: scheduleData, error: scheduleError },
    { data: attendanceData, error: attendanceError },
    { data: leaveEntryData, error: leaveEntryError },
  ] = await Promise.all([
    supabase.from("staff_compensation_profiles").select("*").in("staff_id", staffIds),
    supabase.from("staff_schedules").select("*").in("staff_id", staffIds),
    supabase
      .from("attendance")
      .select("staff_id, status, time_in, time_out, approved_at, attendance_date")
      .gte("attendance_date", periodData.period_start_date)
      .lte("attendance_date", periodData.period_end_date)
      .in("staff_id", staffIds),
    supabase
      .from("staff_leave_entries")
      .select("staff_id, start_date, end_date, leave_type")
      .eq("branch_id", periodData.branch_id)
      .lte("start_date", periodData.period_end_date)
      .gte("end_date", periodData.period_start_date)
      .in("staff_id", staffIds),
  ]);

  if (compensationError) {
    return { status: "error", message: compensationError.message };
  }

  if (scheduleError) {
    return { status: "error", message: scheduleError.message };
  }

  if (attendanceError) {
    return { status: "error", message: attendanceError.message };
  }

  if (leaveEntryError) {
    return { status: "error", message: leaveEntryError.message };
  }

  const compensationByStaffId = new Map(
    (compensationData ?? []).map((row) => [
      row.staff_id,
      {
        id: row.id,
        staffId: row.staff_id,
        payBasis: row.pay_basis,
        baseRate: row.base_rate,
        overtimeRate: row.overtime_rate,
        allowancePerPeriod: row.allowance_per_period,
        effectiveStartDate: row.effective_start_date,
        notes: row.notes,
      },
    ]),
  );
  const scheduleByStaffId = new Map(
    ((scheduleData ?? []) as StaffScheduleRow[]).map((row) => [
      row.staff_id,
      mapStaffScheduleRow(row),
    ]),
  );
  const holidays = ((holidayData ?? []) as Array<{
    holiday_date: string;
    holiday_kind: string;
    pay_treatment: string;
  }>).map<PayrollHolidayRule>((row) => ({
    holidayDate: row.holiday_date,
    holidayKind: row.holiday_kind as PayrollHolidayRule["holidayKind"],
    payTreatment: row.pay_treatment as PayrollHolidayRule["payTreatment"],
  }));
  const attendanceByStaffId = new Map<string, Array<{
    attendanceDate: string;
    status: AttendanceRow["status"];
    timeIn: string | null;
    timeOut: string | null;
    approvedAt: string | null;
  }>>();
  const leaveEntriesByStaffId = new Map<string, Array<{
    startDate: string;
    endDate: string;
    leaveType: StaffLeaveEntrySummary["leaveType"];
  }>>();

  for (const row of (attendanceData ?? []) as AttendanceRow[]) {
    const existing = attendanceByStaffId.get(row.staff_id) ?? [];
    existing.push({
      attendanceDate: row.attendance_date,
      status: row.status,
      timeIn: row.time_in,
      timeOut: row.time_out,
      approvedAt: row.approved_at,
    });
    attendanceByStaffId.set(row.staff_id, existing);
  }

  for (const row of (leaveEntryData ?? []) as StaffLeaveEntryRow[]) {
    const existing = leaveEntriesByStaffId.get(row.staff_id) ?? [];
    existing.push({
      startDate: row.start_date,
      endDate: row.end_date,
      leaveType: row.leave_type as StaffLeaveEntrySummary["leaveType"],
    });
    leaveEntriesByStaffId.set(row.staff_id, existing);
  }

  const existingItems = (existingItemsData ?? []) as Array<{ id: string; staff_id: string }>;
  const existingItemByStaffId = new Map(existingItems.map((row) => [row.staff_id, row.id]));
  let adjustmentRows: Array<{
    payroll_period_item_id: string;
    adjustment_type: string;
    label: string;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  if (existingItems.length > 0) {
    const { data: adjustmentsData, error: adjustmentsError } = await supabase
      .from("payroll_period_item_adjustments")
      .select(
        "payroll_period_item_id, adjustment_type, label, amount, notes, created_at, updated_at",
      )
      .in(
        "payroll_period_item_id",
        existingItems.map((row) => row.id),
      );

    if (adjustmentsError) {
      return { status: "error", message: adjustmentsError.message };
    }

    adjustmentRows = adjustmentsData ?? [];
  }

  const adjustmentsByItemId = new Map<string, Array<{
    adjustmentType: "addition" | "deduction";
    label: string;
    amount: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>>();

  for (const row of adjustmentRows) {
    const existing = adjustmentsByItemId.get(row.payroll_period_item_id) ?? [];
    existing.push({
      adjustmentType: row.adjustment_type as "addition" | "deduction",
      label: row.label,
      amount: row.amount,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    adjustmentsByItemId.set(row.payroll_period_item_id, existing);
  }

  const payrollItemsPayload: Array<TableInsert<"payroll_period_items">> = staffRows.map((staffMember) => {
    const existingItemId = existingItemByStaffId.get(staffMember.id);
    const adjustmentTotals = summarizeAdjustmentTotals(
      (adjustmentsByItemId.get(existingItemId ?? "") ?? []).map((adjustment) => ({
        id: existingItemId ?? "",
        payrollPeriodItemId: existingItemId ?? "",
        adjustmentType: adjustment.adjustmentType,
        label: adjustment.label,
        amount: adjustment.amount,
        notes: adjustment.notes,
        createdAt: adjustment.createdAt,
        updatedAt: adjustment.updatedAt,
      })),
    );
    const computedItem = computePayrollItem({
      staffId: staffMember.id,
      fullName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
      role: staffMember.role,
      schedule: scheduleByStaffId.get(staffMember.id) ?? null,
      compensationProfile: compensationByStaffId.get(staffMember.id) ?? null,
      attendanceRecords: attendanceByStaffId.get(staffMember.id) ?? [],
      holidays,
      leaveEntries: leaveEntriesByStaffId.get(staffMember.id) ?? [],
      periodStartDate: periodData.period_start_date,
      periodEndDate: periodData.period_end_date,
      settings: {
        standardDailyHours: settingsData.payroll_standard_daily_hours ?? 8,
        holidayPremiumRate: settingsData.payroll_holiday_premium_rate ?? 0.3,
      },
      manualAdditionsTotal: adjustmentTotals.manualAdditionsTotal,
      manualDeductionsTotal: adjustmentTotals.manualDeductionsTotal,
    });

    return {
      payroll_period_id: periodData.id,
      branch_id: periodData.branch_id,
      staff_id: computedItem.staffId,
      staff_name: computedItem.fullName,
      staff_role: computedItem.role,
      pay_basis: computedItem.payBasis,
      base_rate: computedItem.baseRate,
      overtime_rate: computedItem.overtimeRate,
      allowance_per_period: computedItem.allowancePerPeriod,
      daily_rate_used: computedItem.dailyRateUsed,
      hourly_rate_used: computedItem.hourlyRateUsed,
      standard_daily_hours: computedItem.standardDailyHours,
      holiday_premium_rate: computedItem.holidayPremiumRate,
      scheduled_workday_count: computedItem.scheduledWorkdayCount,
      holiday_day_count: computedItem.holidayDayCount,
      approved_leave_day_count: computedItem.approvedLeaveDayCount,
      expected_workday_count: computedItem.expectedWorkdayCount,
      missing_attendance_day_count: computedItem.missingAttendanceDayCount,
      recorded_day_count: computedItem.recordedDayCount,
      present_count: computedItem.presentCount,
      late_count: computedItem.lateCount,
      half_day_count: computedItem.halfDayCount,
      absent_count: computedItem.absentCount,
      missing_timeout_count: computedItem.missingTimeoutCount,
      pending_approval_count: computedItem.pendingApprovalCount,
      worked_minutes: computedItem.workedMinutes,
      paid_day_units: computedItem.paidDayUnits,
      holiday_worked_day_units: computedItem.holidayWorkedDayUnits,
      late_deduction_minutes: computedItem.lateDeductionMinutes,
      overtime_minutes: computedItem.overtimeMinutes,
      base_pay: computedItem.basePay,
      late_deduction_amount: computedItem.lateDeductionAmount,
      holiday_premium_pay: computedItem.holidayPremiumPay,
      overtime_pay: computedItem.overtimePay,
      allowance_pay: computedItem.allowancePay,
      computed_pay: computedItem.computedPay,
      manual_additions_total: computedItem.manualAdditionsTotal,
      manual_deductions_total: computedItem.manualDeductionsTotal,
      gross_pay: computedItem.grossPay,
      net_pay: computedItem.netPay,
      readiness_status: computedItem.readinessStatus,
      warning_codes: computedItem.warningCodes,
    };
  });

  const { error: upsertError } = await supabase.from("payroll_period_items").upsert(
    payrollItemsPayload,
    {
      onConflict: "payroll_period_id,staff_id",
    },
  );

  if (upsertError) {
    return { status: "error", message: upsertError.message };
  }

  const removableItemIds = existingItems
    .filter((row) => !staffIds.includes(row.staff_id))
    .map((row) => row.id);

  if (removableItemIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("payroll_period_items")
      .delete()
      .in("id", removableItemIds);

    if (deleteError) {
      return { status: "error", message: deleteError.message };
    }
  }

  const { error: periodUpdateError } = await supabase
    .from("payroll_periods")
    .update({
      generated_at: new Date().toISOString(),
      generated_by_staff_id: context.staffId,
    })
    .eq("id", periodId);

  if (periodUpdateError) {
    return { status: "error", message: periodUpdateError.message };
  }

  await writeAuditLog(supabase, {
    action: `Generated payroll cut for ${periodData.label}`,
    entityType: "payroll_period",
    entityId: periodData.id,
    userId: context.userId,
    afterData: {
      branch_id: periodData.branch_id,
      period_start_date: periodData.period_start_date,
      period_end_date: periodData.period_end_date,
      generated_staff_count: staffIds.length,
    },
  });

  revalidatePayrollPaths(periodId);

  return {
    status: "success",
    message: `Payroll cut generated for ${staffIds.length} staff member${staffIds.length === 1 ? "" : "s"}.`,
  };
}

export async function upsertPayrollAdjustmentAction(
  _prevState: PayrollFormActionState = INITIAL_PAYROLL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const parsed = payrollAdjustmentSchema.safeParse(parsePayrollAdjustmentFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("payroll:write");
  const { data: itemData, error: itemError } = await supabase
    .from("payroll_period_items")
    .select("id, branch_id, payroll_period_id")
    .eq("id", values.payrollPeriodItemId)
    .maybeSingle();

  if (itemError) {
    return { status: "error", message: itemError.message };
  }

  if (!itemData || itemData.payroll_period_id !== values.payrollPeriodId) {
    return { status: "error", message: "Payroll row not found." };
  }

  await requireBranchAccess(itemData.branch_id);

  const { data: periodData, error: periodError } = await supabase
    .from("payroll_periods")
    .select("status")
    .eq("id", values.payrollPeriodId)
    .maybeSingle();

  if (periodError) {
    return { status: "error", message: periodError.message };
  }

  if (periodData?.status === "finalized") {
    return { status: "error", message: "Finalized payroll periods are locked." };
  }

  const { error } = await supabase.from("payroll_period_item_adjustments").insert({
    payroll_period_item_id: values.payrollPeriodItemId,
    adjustment_type: values.adjustmentType,
    label: values.label,
    amount: Number(values.amount),
    notes: normalizeNullable(values.notes),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  await refreshPayrollItemTotals(supabase, values.payrollPeriodItemId);
  await writeAuditLog(supabase, {
    action: `Added payroll ${values.adjustmentType}`,
    entityType: "payroll_period_item_adjustment",
    entityId: values.payrollPeriodItemId,
    userId: context.userId,
    afterData: {
      payroll_period_id: values.payrollPeriodId,
      adjustment_type: values.adjustmentType,
      label: values.label,
      amount: Number(values.amount),
      notes: normalizeNullable(values.notes),
    },
  });

  revalidatePayrollPaths(values.payrollPeriodId);

  return {
    status: "success",
    message: "Payroll adjustment saved.",
  };
}

export async function deletePayrollAdjustmentAction(formData: FormData) {
  const parsed = deleteAdjustmentSchema.safeParse({
    adjustmentId: readString(formData, "adjustmentId"),
    payrollPeriodId: readString(formData, "payrollPeriodId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid payroll adjustment request.");
  }

  const { adjustmentId, payrollPeriodId } = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("payroll:write");
  const { data: adjustmentData, error: adjustmentError } = await supabase
    .from("payroll_period_item_adjustments")
    .select("id, payroll_period_item_id")
    .eq("id", adjustmentId)
    .maybeSingle();

  if (adjustmentError) {
    throw new Error(adjustmentError.message);
  }

  if (!adjustmentData) {
    throw new Error("Payroll adjustment not found.");
  }

  const { data: itemData, error: itemError } = await supabase
    .from("payroll_period_items")
    .select("id, branch_id, payroll_period_id")
    .eq("id", adjustmentData.payroll_period_item_id)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (!itemData || itemData.payroll_period_id !== payrollPeriodId) {
    throw new Error("Payroll row not found.");
  }

  await requireBranchAccess(itemData.branch_id);

  const { error: deleteError } = await supabase
    .from("payroll_period_item_adjustments")
    .delete()
    .eq("id", adjustmentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await refreshPayrollItemTotals(supabase, itemData.id);
  await writeAuditLog(supabase, {
    action: "Deleted payroll adjustment",
    entityType: "payroll_period_item_adjustment",
    entityId: adjustmentId,
    userId: context.userId,
    afterData: {
      payroll_period_id: payrollPeriodId,
      payroll_period_item_id: itemData.id,
    },
  });

  revalidatePayrollPaths(payrollPeriodId);
}

export async function updatePayrollPeriodStatusAction(
  _prevState: PayrollFormActionState = INITIAL_PAYROLL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<PayrollFormActionState> {
  const parsed = payrollPeriodStatusSchema.safeParse(parsePayrollPeriodStatusFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("payroll:write");
  const { data: periodData, error: periodError } = await supabase
    .from("payroll_periods")
    .select("id, branch_id, label, status, generated_at")
    .eq("id", values.periodId)
    .maybeSingle();

  if (periodError) {
    return {
      status: "error",
      message: periodError.message,
    };
  }

  if (!periodData) {
    return {
      status: "error",
      message: "Payroll period not found.",
    };
  }

  await requireBranchAccess(periodData.branch_id);

  if (periodData.status === "finalized") {
    return {
      status: "error",
      message: "Finalized payroll periods are locked.",
    };
  }

  if (values.status !== "draft") {
    const { count, error: itemCountError } = await supabase
      .from("payroll_period_items")
      .select("id", { count: "exact", head: true })
      .eq("payroll_period_id", values.periodId);

    if (itemCountError) {
      return {
        status: "error",
        message: itemCountError.message,
      };
    }

    if (!periodData.generated_at || !count) {
      return {
        status: "error",
        message: "Generate the payroll cut before locking or finalizing this period.",
      };
    }
  }

  const payload = {
    status: values.status,
    finalized_at: values.status === "finalized" ? new Date().toISOString() : null,
    finalized_by_staff_id: values.status === "finalized" ? context.staffId : null,
  };

  const { error } = await supabase
    .from("payroll_periods")
    .update(payload)
    .eq("id", values.periodId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await writeAuditLog(supabase, {
    action: `Updated payroll period status to ${values.status}`,
    entityType: "payroll_period",
    entityId: values.periodId,
    userId: context.userId,
    afterData: payload,
  });

  revalidatePayrollPaths(values.periodId);

  return {
    status: "success",
    message: "Payroll period status updated.",
  };
}

async function refreshPayrollItemTotals(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  payrollPeriodItemId: string,
) {
  const { data: itemData, error: itemError } = await supabase
    .from("payroll_period_items")
    .select("id, computed_pay")
    .eq("id", payrollPeriodItemId)
    .single();

  if (itemError) {
    throw new Error(itemError.message);
  }

  const { data: adjustmentData, error: adjustmentError } = await supabase
    .from("payroll_period_item_adjustments")
    .select("id, payroll_period_item_id, adjustment_type, label, amount, notes, created_at, updated_at")
    .eq("payroll_period_item_id", payrollPeriodItemId);

  if (adjustmentError) {
    throw new Error(adjustmentError.message);
  }

  const totals = summarizeAdjustmentTotals(
    (adjustmentData ?? []).map((row) => ({
      id: row.id,
      payrollPeriodItemId: row.payroll_period_item_id,
      adjustmentType: row.adjustment_type as "addition" | "deduction",
      label: row.label,
      amount: row.amount,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );

  const grossPay = Number((itemData.computed_pay + totals.manualAdditionsTotal).toFixed(4));
  const netPay = Number((grossPay - totals.manualDeductionsTotal).toFixed(4));

  const { error: updateError } = await supabase
    .from("payroll_period_items")
    .update({
      manual_additions_total: totals.manualAdditionsTotal,
      manual_deductions_total: totals.manualDeductionsTotal,
      gross_pay: grossPay,
      net_pay: netPay,
    })
    .eq("id", payrollPeriodItemId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function mapStaffScheduleRow(row: StaffScheduleRow) {
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

function revalidatePayrollPaths(periodId?: string) {
  revalidatePath("/payroll");

  if (periodId) {
    revalidatePath(`/payroll/${periodId}`);
    revalidatePath(`/payroll/${periodId}/print`);
  }
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
