import { DateTime } from "luxon";
import { z } from "zod";

import type {
  PayrollAdjustmentFormValues,
  CompensationProfileFormValues,
  PayrollPeriodFormValues,
  PayrollPeriodStatusFormValues,
} from "@/features/payroll/types";
import { isNonNegativeMoneyInput } from "@/lib/currency";

const BUSINESS_TIMEZONE = "Asia/Manila";

const moneyField = z
  .string()
  .trim()
  .min(1, "This amount is required.")
  .refine(isNonNegativeMoneyInput, {
    message: "Enter a valid amount with up to 4 decimal places.",
  });

const optionalMoneyField = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isNonNegativeMoneyInput(value), {
    message: "Enter a valid amount with up to 4 decimal places.",
  });

export const compensationProfileSchema = z.object({
  staffId: z.string().uuid("Select a staff member."),
  payBasis: z.enum(["monthly", "daily", "hourly"]),
  baseRate: moneyField,
  overtimeRate: optionalMoneyField,
  allowancePerPeriod: moneyField,
  effectiveStartDate: z.string().trim().refine(isValidDate, {
    message: "Enter a valid effective date.",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
});

export const payrollPeriodSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required."),
    periodStartDate: z.string().trim().refine(isValidDate, {
      message: "Enter a valid period start date.",
    }),
    periodEndDate: z.string().trim().refine(isValidDate, {
      message: "Enter a valid period end date.",
    }),
    payoutDate: z.string().trim().refine(isValidDate, {
      message: "Enter a valid payout date.",
    }),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
  })
  .superRefine((values, context) => {
    const startDate = parseDate(values.periodStartDate);
    const endDate = parseDate(values.periodEndDate);
    const payoutDate = parseDate(values.payoutDate);

    if (startDate && endDate && endDate < startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodEndDate"],
        message: "Period end date must be on or after the start date.",
      });
    }

    if (endDate && payoutDate && payoutDate < endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payoutDate"],
        message: "Payout date cannot be earlier than the period end date.",
      });
    }
  });

export const payrollPeriodStatusSchema = z.object({
  periodId: z.string().uuid("Select a payroll period."),
  status: z.enum(["draft", "processing", "finalized"]),
});

export const payrollAdjustmentSchema = z.object({
  payrollPeriodId: z.string().uuid("Select a payroll period."),
  payrollPeriodItemId: z.string().uuid("Select a payroll staff row."),
  adjustmentType: z.enum(["addition", "deduction"]),
  label: z.string().trim().min(1, "Adjustment label is required.").max(120, "Adjustment label is too long."),
  amount: moneyField,
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer."),
});

export function parseCompensationProfileFormData(formData: FormData): CompensationProfileFormValues {
  return {
    staffId: readString(formData, "staffId"),
    payBasis: readString(formData, "payBasis") as CompensationProfileFormValues["payBasis"],
    baseRate: readString(formData, "baseRate"),
    overtimeRate: readString(formData, "overtimeRate"),
    allowancePerPeriod: readString(formData, "allowancePerPeriod"),
    effectiveStartDate: readString(formData, "effectiveStartDate"),
    notes: readString(formData, "notes"),
  };
}

export function parsePayrollPeriodFormData(formData: FormData): PayrollPeriodFormValues {
  return {
    label: readString(formData, "label"),
    periodStartDate: readString(formData, "periodStartDate"),
    periodEndDate: readString(formData, "periodEndDate"),
    payoutDate: readString(formData, "payoutDate"),
    notes: readString(formData, "notes"),
  };
}

export function parsePayrollPeriodStatusFormData(formData: FormData): PayrollPeriodStatusFormValues {
  return {
    periodId: readString(formData, "periodId"),
    status: readString(formData, "status") as PayrollPeriodStatusFormValues["status"],
  };
}

export function parsePayrollAdjustmentFormData(formData: FormData): PayrollAdjustmentFormValues {
  return {
    payrollPeriodId: readString(formData, "payrollPeriodId"),
    payrollPeriodItemId: readString(formData, "payrollPeriodItemId"),
    adjustmentType: readString(formData, "adjustmentType") as PayrollAdjustmentFormValues["adjustmentType"],
    label: readString(formData, "label"),
    amount: readString(formData, "amount"),
    notes: readString(formData, "notes"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isValidDate(value: string) {
  return parseDate(value) !== null;
}

function parseDate(value: string) {
  const parsed = DateTime.fromISO(value, { zone: BUSINESS_TIMEZONE });
  return parsed.isValid ? parsed : null;
}
