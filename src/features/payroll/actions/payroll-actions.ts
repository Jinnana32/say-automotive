"use server";

import { revalidatePath } from "next/cache";

import { computeExpectedWorkdaySummary } from "@/features/attendance/utils";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import {
  compensationProfileSchema,
  parseCompensationProfileFormData,
  parsePayrollPeriodFormData,
  parsePayrollPeriodStatusFormData,
  payrollPeriodSchema,
  payrollPeriodStatusSchema,
} from "@/features/payroll/schemas/payroll-schemas";
import type { PayrollFormActionState } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE, isBlockedPayrollStaffSummary, resolvePayrollReadinessStatus, summarizePayrollAttendance } from "@/features/payroll/utils";

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
  const { supabase } = await getAuthorizedSupabaseServerClient("payroll:write");
  const { error } = await supabase.from("staff_compensation_profiles").upsert(
    {
      staff_id: values.staffId,
      pay_basis: values.payBasis,
      base_rate: Number(values.baseRate),
      overtime_rate: values.overtimeRate.trim() ? Number(values.overtimeRate) : null,
      allowance_per_period: Number(values.allowancePerPeriod),
      effective_start_date: values.effectiveStartDate,
      notes: normalizeNullable(values.notes),
    },
    {
      onConflict: "staff_id",
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/payroll");

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
  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("payroll:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
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

  revalidatePath("/payroll");

  return {
    status: "success",
    message: "Payroll period created.",
  };
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
  const { context, supabase } = await getAuthorizedSupabaseServerClient("payroll:write");
  const { data: periodData, error: periodError } = await supabase
    .from("payroll_periods")
    .select("id, branch_id, label, period_start_date, period_end_date, status")
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

  if (periodData.status === "finalized") {
    return {
      status: "error",
      message: "Finalized payroll periods are locked.",
    };
  }

  if (values.status === "finalized") {
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("status", "active");

    if (staffError) {
      return {
        status: "error",
        message: staffError.message,
      };
    }

    const staffIds = (staffData ?? []).map((row) => row.id);
    let compensationRows: Array<{ staff_id: string }> = [];
    let holidayRows: Array<{ holiday_date: string }> = [];
    let scheduleRows: Array<{
      staff_id: string;
      monday_is_workday: boolean;
      tuesday_is_workday: boolean;
      wednesday_is_workday: boolean;
      thursday_is_workday: boolean;
      friday_is_workday: boolean;
      saturday_is_workday: boolean;
      sunday_is_workday: boolean;
      shift_start_time: string;
      shift_end_time: string;
      grace_minutes: number;
      notes: string | null;
      id: string;
    }> = [];
    let leaveEntryRows: Array<{
      staff_id: string;
      start_date: string;
      end_date: string;
    }> = [];
    let attendanceRows: Array<{
      staff_id: string;
      status: "present" | "absent" | "late" | "half_day";
      time_in: string | null;
      time_out: string | null;
      attendance_date: string;
      approved_at: string | null;
    }> = [];

    if (staffIds.length > 0) {
      const [
        { data: compensationData, error: compensationError },
        { data: holidayData, error: holidayError },
        { data: scheduleData, error: scheduleError },
        { data: leaveEntryData, error: leaveEntryError },
        { data: attendanceData, error: attendanceError },
      ] =
        await Promise.all([
          supabase.from("staff_compensation_profiles").select("staff_id").in("staff_id", staffIds),
          supabase
            .from("branch_holidays")
            .select("holiday_date")
            .eq("branch_id", periodData.branch_id)
            .gte("holiday_date", periodData.period_start_date)
            .lte("holiday_date", periodData.period_end_date),
          supabase
            .from("staff_schedules")
            .select(
              "id, staff_id, monday_is_workday, tuesday_is_workday, wednesday_is_workday, thursday_is_workday, friday_is_workday, saturday_is_workday, sunday_is_workday, shift_start_time, shift_end_time, grace_minutes, notes",
            )
            .in("staff_id", staffIds),
          supabase
            .from("staff_leave_entries")
            .select("staff_id, start_date, end_date")
            .eq("branch_id", periodData.branch_id)
            .lte("start_date", periodData.period_end_date)
            .gte("end_date", periodData.period_start_date)
            .in("staff_id", staffIds),
          supabase
            .from("attendance")
            .select("staff_id, status, time_in, time_out, attendance_date, approved_at")
            .gte("attendance_date", periodData.period_start_date)
            .lte("attendance_date", periodData.period_end_date)
            .in("staff_id", staffIds),
        ]);

      if (compensationError) {
        return {
          status: "error",
          message: compensationError.message,
        };
      }

      if (holidayError) {
        return {
          status: "error",
          message: holidayError.message,
        };
      }

      if (scheduleError) {
        return {
          status: "error",
          message: scheduleError.message,
        };
      }

      if (leaveEntryError) {
        return {
          status: "error",
          message: leaveEntryError.message,
        };
      }

      if (attendanceError) {
        return {
          status: "error",
          message: attendanceError.message,
        };
      }

      compensationRows = compensationData ?? [];
      holidayRows = holidayData ?? [];
      scheduleRows = scheduleData ?? [];
      leaveEntryRows = leaveEntryData ?? [];
      attendanceRows = attendanceData ?? [];
    }

    const compensationStaffIds = new Set(compensationRows.map((row) => row.staff_id));
    const holidayDates = new Set(holidayRows.map((row) => row.holiday_date));
    const scheduleByStaffId = new Map(
      scheduleRows.map((row) => [row.staff_id, row]),
    );
    const attendanceByStaffId = new Map<string, typeof attendanceRows>();
    const leaveEntriesByStaffId = new Map<string, typeof leaveEntryRows>();

    for (const row of attendanceRows) {
      const existing = attendanceByStaffId.get(row.staff_id) ?? [];
      existing.push(row);
      attendanceByStaffId.set(row.staff_id, existing);
    }

    for (const row of leaveEntryRows) {
      const existing = leaveEntriesByStaffId.get(row.staff_id) ?? [];
      existing.push(row);
      leaveEntriesByStaffId.set(row.staff_id, existing);
    }

    const hasBlockingIssue = staffIds.some((staffId) => {
      const rows = attendanceByStaffId.get(staffId) ?? [];
      const attendanceSummary = summarizePayrollAttendance(
        rows.map((row) => ({
          status: row.status,
          timeIn: row.time_in,
          timeOut: row.time_out,
          approvedAt: row.approved_at,
        })),
      );
      const schedule = scheduleByStaffId.get(staffId)
        ? {
            id: scheduleByStaffId.get(staffId)!.id,
            staffId: scheduleByStaffId.get(staffId)!.staff_id,
            shiftStartTime: scheduleByStaffId.get(staffId)!.shift_start_time,
            shiftEndTime: scheduleByStaffId.get(staffId)!.shift_end_time,
            graceMinutes: scheduleByStaffId.get(staffId)!.grace_minutes,
            mondayIsWorkday: scheduleByStaffId.get(staffId)!.monday_is_workday,
            tuesdayIsWorkday: scheduleByStaffId.get(staffId)!.tuesday_is_workday,
            wednesdayIsWorkday: scheduleByStaffId.get(staffId)!.wednesday_is_workday,
            thursdayIsWorkday: scheduleByStaffId.get(staffId)!.thursday_is_workday,
            fridayIsWorkday: scheduleByStaffId.get(staffId)!.friday_is_workday,
            saturdayIsWorkday: scheduleByStaffId.get(staffId)!.saturday_is_workday,
            sundayIsWorkday: scheduleByStaffId.get(staffId)!.sunday_is_workday,
            notes: scheduleByStaffId.get(staffId)!.notes,
          }
        : null;
      const expectationSummary = computeExpectedWorkdaySummary({
        schedule,
        startDate: periodData.period_start_date,
        endDate: periodData.period_end_date,
        holidayDates,
        leaveEntries: (leaveEntriesByStaffId.get(staffId) ?? []).map((row) => ({
          startDate: row.start_date,
          endDate: row.end_date,
        })),
      });
      const missingAttendanceDayCount = Math.max(
        expectationSummary.expectedWorkdayCount - attendanceSummary.recordedDays,
        0,
      );
      const readinessStatus = resolvePayrollReadinessStatus({
        hasCompensationProfile: compensationStaffIds.has(staffId),
        hasSchedule: schedule !== null,
        expectedWorkdayCount: expectationSummary.expectedWorkdayCount,
        hadAttendanceActivity: attendanceSummary.recordedDays > 0,
        missingAttendanceDayCount,
        missingTimeoutCount: attendanceSummary.missingTimeoutCount,
      });

      return isBlockedPayrollStaffSummary({
        readinessStatus,
      });
    });

    if (hasBlockingIssue) {
      return {
        status: "error",
        message:
          "This payroll period still has blocking issues. Complete missing attendance on scheduled workdays, add schedules or compensation where needed, and close open time-outs before finalizing.",
      };
    }
  }

  const { error } = await supabase
    .from("payroll_periods")
    .update({
      status: values.status,
      finalized_at: values.status === "finalized" ? new Date().toISOString() : null,
      finalized_by_staff_id: values.status === "finalized" ? context.staffId : null,
    })
    .eq("id", values.periodId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${values.periodId}`);

  return {
    status: "success",
    message: "Payroll period status updated.",
  };
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
