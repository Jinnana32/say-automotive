import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PayslipPrintLayout } from "@/components/reports/payslip-print-layout";
import type { PayslipPrintDocument } from "@/features/payroll/types";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const documentFixture: PayslipPrintDocument = {
  period: {
    id: "period-1",
    branchId: "branch-1",
    label: "June 2026",
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-15",
    payoutDate: "2026-06-20",
    status: "draft",
    notes: null,
    createdByStaffId: null,
    generatedByStaffId: null,
    generatedAt: null,
    finalizedByStaffId: null,
    finalizedAt: null,
    createdAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
  },
  settings: {
    standardDailyHours: 8,
    holidayPremiumRate: 0.3,
  },
  item: {
    id: "item-1",
    payrollPeriodId: "period-1",
    branchId: "branch-1",
    staffId: "staff-1",
    fullName: "Juan Dela Cruz",
    role: "mechanic",
    payBasis: "daily",
    baseRate: 680,
    overtimeRate: null,
    allowancePerPeriod: 153,
    dailyRateUsed: 680,
    hourlyRateUsed: 85,
    standardDailyHours: 8,
    holidayPremiumRate: 0.3,
    scheduledWorkdayCount: 10,
    holidayDayCount: 1,
    approvedLeaveDayCount: 0,
    expectedWorkdayCount: 10,
    missingAttendanceDayCount: 0,
    recordedDayCount: 10,
    presentCount: 8,
    lateCount: 2,
    halfDayCount: 0,
    absentCount: 0,
    missingTimeoutCount: 0,
    pendingApprovalCount: 0,
    workedMinutes: 4800,
    paidDayUnits: 9,
    holidayWorkedDayUnits: 1,
    lateDeductionMinutes: 30,
    overtimeMinutes: 45,
    basePay: 6120,
    lateDeductionAmount: 42.5,
    holidayPremiumPay: 204,
    overtimePay: 63.75,
    allowancePay: 153,
    computedPay: 6498.25,
    manualAdditionsTotal: 400,
    manualDeductionsTotal: 250,
    grossPay: 6898.25,
    netPay: 10636.6875,
    readinessStatus: "ready",
    warningCodes: [],
    adjustments: [
      {
        id: "adjustment-1",
        payrollPeriodItemId: "item-1",
        adjustmentType: "addition",
        label: "Performance bonus",
        amount: 400,
        notes: null,
        createdAt: "2026-06-16T00:00:00.000Z",
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    ],
  },
  businessProfile: {
    businessName: "SAY Auto Care Center",
    businessLogoUrl: null,
    businessVatRegistrationNo: "244-205-707",
    businessContact: "09171864070",
    businessEmail: "sayautomotivecare@gmail.com",
    businessAddress: "39 Guzman St., Mandurriao, Iloilo City",
  },
  generatedAt: "2026-06-16T08:30:00.000Z",
};

describe("PayslipPrintLayout", () => {
  it("renders employee-facing payslip details without internal payroll rule", () => {
    render(<PayslipPrintLayout document={documentFixture} />);

    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.queryByText("Payroll rule")).not.toBeInTheDocument();
    expect(screen.queryByText("8h day · 30.00% holiday premium")).not.toBeInTheDocument();
    expect(screen.getByText("On-time days")).toBeInTheDocument();
    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Deductions")).toBeInTheDocument();
    expect(screen.getByText("₱6,120.00")).toBeInTheDocument();
    expect(screen.getByText("₱153.00")).toBeInTheDocument();
    expect(screen.getByText("₱10,636.69")).toBeInTheDocument();
    expect(screen.queryByText("₱6,120.0000")).not.toBeInTheDocument();
  });
});
