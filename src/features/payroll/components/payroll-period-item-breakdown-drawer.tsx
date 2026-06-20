"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBranchHolidayKindLabel, formatBranchHolidayPayTreatmentLabel } from "@/features/attendance/utils";
import type {
  PayrollPeriodItemBreakdownData,
  PayrollPeriodItemSummary,
} from "@/features/payroll/types";
import {
  formatPayBasisLabel,
  formatPayrollCoverage,
  formatPayrollDayUnits,
  formatPayrollReadinessLabel,
  formatPayrollWarningLabel,
  formatWorkedDuration,
  getPayrollAttendedDayCount,
  getPayrollReadinessTone,
} from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate, fromUtcIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

async function fetchPayrollItemBreakdown(periodId: string, itemId: string) {
  const response = await fetch(`/api/payroll/${periodId}/items/${itemId}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Unable to load the payroll breakdown.");
  }

  return (await response.json()) as PayrollPeriodItemBreakdownData;
}

export function PayrollPeriodItemBreakdownDrawer({
  periodId,
  item,
}: {
  periodId: string;
  item: PayrollPeriodItemSummary;
}) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["payroll-period-item-breakdown", periodId, item.id],
    queryFn: () => fetchPayrollItemBreakdown(periodId, item.id),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hasAttendanceRecords = query.data?.days.some((day) => day.hasAttendanceRecord) ?? false;
  const regularMinutes = Math.max(item.workedMinutes - item.overtimeMinutes, 0);
  const adjustmentsNet = item.manualAdditionsTotal - item.manualDeductionsTotal;

  return (
    <>
      <button
        type="button"
        className="text-left font-semibold text-foreground transition hover:text-[#D71920] hover:underline focus:outline-none focus:ring-2 focus:ring-[#D71920]/30 focus:ring-offset-2 focus:ring-offset-background"
        onClick={() => setOpen(true)}
        aria-label={`Open payroll breakdown for ${item.fullName}`}
        title="Open payroll breakdown"
      >
        {item.fullName}
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[140] bg-slate-950/55 backdrop-blur-[2px]"
              onMouseDown={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`payroll-breakdown-title-${item.id}`}
                className="absolute inset-y-0 right-0 flex h-full w-full justify-end"
              >
                <div
                  className="flex h-full w-full max-w-full flex-col overflow-hidden border-l border-border/70 bg-background shadow-2xl shadow-slate-950/30 sm:max-w-3xl xl:max-w-5xl"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                          Payroll breakdown
                        </p>
                        <h2
                          id={`payroll-breakdown-title-${item.id}`}
                          className="text-xl font-semibold text-foreground"
                        >
                          {item.fullName}
                        </h2>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Payroll period: {query.data ? formatPayrollCoverage(query.data.period.periodStartDate, query.data.period.periodEndDate) : "Loading period..."}</p>
                        <p>
                          Pay basis:{" "}
                          {item.payBasis ? formatPayBasisLabel(item.payBasis) : "Not configured"}
                          {" · "}
                          Base rate:{" "}
                          {item.baseRate !== null ? formatCurrency(item.baseRate) : "Not configured"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="size-9 p-0"
                      onClick={() => setOpen(false)}
                      aria-label="Close payroll breakdown"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    {query.isLoading ? (
                      <div className="flex min-h-[240px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Loading payroll breakdown...</span>
                        </div>
                      </div>
                    ) : query.isError ? (
                      <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="flex items-start gap-3 p-5">
                          <AlertCircle className="mt-0.5 size-4 text-destructive" />
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Unable to load breakdown</p>
                            <p className="text-sm text-muted-foreground">
                              {query.error instanceof Error
                                ? query.error.message
                                : "Please try again in a moment."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : query.data ? (
                      <PayrollBreakdownContent
                        data={query.data}
                        hasAttendanceRecords={hasAttendanceRecords}
                        regularMinutes={regularMinutes}
                        adjustmentsNet={adjustmentsNet}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function PayrollBreakdownContent({
  data,
  hasAttendanceRecords,
  regularMinutes,
  adjustmentsNet,
}: {
  data: PayrollPeriodItemBreakdownData;
  hasAttendanceRecords: boolean;
  regularMinutes: number;
  adjustmentsNet: number;
}) {
  const attendedDayCount = getPayrollAttendedDayCount(data.item);
  const approvedLeaveDayCount = data.days.filter((day) => day.isApprovedLeavePaidDay).length;
  const approvedLeavePay = data.days.reduce((total, day) => total + day.approvedLeavePay, 0);
  const workedDuringLeaveDayCount = data.days.filter(
    (day) => day.isWorkedDuringApprovedLeave,
  ).length;
  const workedDuringLeavePremiumPay = data.days.reduce(
    (total, day) => total + day.workedDuringApprovedLeavePremiumPay,
    0,
  );
  const regularPay = data.item.basePay - approvedLeavePay;
  const summaryCards = useMemo(
    () => [
      { label: "Paid days", value: formatPayrollDayUnits(data.item.paidDayUnits) },
      { label: "Approved leave", value: String(approvedLeaveDayCount) },
      { label: "Worked during leave", value: String(workedDuringLeaveDayCount) },
      { label: "Attended days", value: String(attendedDayCount) },
      { label: "Late", value: String(data.item.lateCount) },
      { label: "Half days", value: String(data.item.halfDayCount) },
      { label: "Absent", value: String(data.item.absentCount) },
      { label: "Missing attendance", value: String(data.item.missingAttendanceDayCount) },
      { label: "Missing timeout", value: String(data.item.missingTimeoutCount) },
      { label: "Regular hours", value: formatWorkedDuration(regularMinutes) },
      { label: "OT hours", value: formatWorkedDuration(data.item.overtimeMinutes) },
      { label: "Gross pay", value: formatCurrency(data.item.grossPay) },
      { label: "Net pay", value: formatCurrency(data.item.netPay) },
    ],
    [
      approvedLeaveDayCount,
      attendedDayCount,
      data.item,
      regularMinutes,
      workedDuringLeaveDayCount,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/70 bg-muted/10">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {card.label}
              </p>
              <p className="text-xl font-semibold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="text-base">Payroll calculation notes</CardTitle>
            <p className="text-sm text-muted-foreground">{data.recordedVsPaidExplanation}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={getPayrollReadinessTone(data.item.readinessStatus)}>
                {formatPayrollReadinessLabel(data.item.readinessStatus)}
              </StatusBadge>
              {data.item.warningCodes.map((warningCode) => (
                <StatusBadge key={warningCode} tone="warning">
                  {formatPayrollWarningLabel(warningCode)}
                </StatusBadge>
              ))}
            </div>

            {data.differenceDetails.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {data.differenceDetails.map((detail) => (
                  <li key={`${detail.date}-${detail.statusLabel}-${detail.reason}`}>
                    <span className="font-medium text-foreground">{formatDate(detail.date)}</span>
                    {" — "}
                    {detail.statusLabel}
                    {" — "}
                    {detail.reason}
                    {detail.paidDayUnits > 0 && detail.paidDayUnits !== 1
                      ? ` (${formatPayrollDayUnits(detail.paidDayUnits)} paid day${detail.paidDayUnits === 1 ? "" : "s"})`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Paid days, status counts, and warning dates line up for this payroll row.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Earnings breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <BreakdownRow label="Regular Pay" value={formatCurrency(regularPay)} />
            <BreakdownRow label="Approved Leave Pay" value={formatCurrency(approvedLeavePay)} />
            <BreakdownRow
              label="Late deductions"
              value={`-${formatCurrency(data.item.lateDeductionAmount)}`}
              valueClassName={data.item.lateDeductionAmount > 0 ? "text-amber-600" : undefined}
            />
            <BreakdownRow label="Holiday premium" value={formatCurrency(data.item.holidayPremiumPay)} />
            <BreakdownRow
              label="Worked During Leave Premium"
              value={formatCurrency(workedDuringLeavePremiumPay)}
            />
            <BreakdownRow label="Overtime earnings" value={formatCurrency(data.item.overtimePay)} />
            <BreakdownRow label="Allowance" value={formatCurrency(data.item.allowancePay)} />
            <BreakdownRow label="Computed pay" value={formatCurrency(data.item.computedPay)} />
            <BreakdownRow label="Additions" value={formatCurrency(data.item.manualAdditionsTotal)} />
            <BreakdownRow
              label="Deductions"
              value={`-${formatCurrency(data.item.manualDeductionsTotal)}`}
            />
            <BreakdownRow
              label="Adjustments net"
              value={formatCurrency(adjustmentsNet)}
              valueClassName={cn(
                adjustmentsNet > 0 && "text-emerald-600",
                adjustmentsNet < 0 && "text-amber-600",
              )}
            />
            <div className="border-t border-border/70 pt-3">
              <BreakdownRow
                label="Gross pay"
                value={formatCurrency(data.item.grossPay)}
                labelClassName="font-semibold text-foreground"
                valueClassName="font-semibold text-foreground"
              />
              <BreakdownRow
                label="Net pay"
                value={formatCurrency(data.item.netPay)}
                labelClassName="font-semibold text-foreground"
                valueClassName="font-semibold text-foreground"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          {data.warningDetails.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {data.warningDetails.map((warningDetail) => (
                <li key={`${warningDetail.date ?? "general"}-${warningDetail.label}-${warningDetail.reason}`}>
                  {warningDetail.date ? (
                    <span className="font-medium text-foreground">{formatDate(warningDetail.date)}</span>
                  ) : (
                    <span className="font-medium text-foreground">General</span>
                  )}
                  {" — "}
                  {warningDetail.label}
                  {" — "}
                  {warningDetail.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No warning dates were found for this payroll row.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="text-base">Daily attendance breakdown</CardTitle>
          {!hasAttendanceRecords ? (
            <p className="text-sm text-muted-foreground">
              No attendance records found for this staff member in this payroll period.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time in</TableHead>
                  <TableHead>Time out</TableHead>
                  <TableHead>Regular hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Paid?</TableHead>
                  <TableHead>Pay reason / notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.days.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{formatDate(day.date)}</p>
                        {day.holidayLabel ? (
                          <p className="text-xs text-muted-foreground">{day.holidayLabel}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {day.weekdayLabel}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        <StatusBadge tone={resolveDayStatusTone(day.statusLabel)}>
                          {day.statusLabel}
                        </StatusBadge>
                        {day.warningCodes.length > 0 ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {day.warningCodes.map((warningCode) => (
                              <p key={`${day.date}-${warningCode}`}>
                                {formatPayrollWarningLabel(warningCode)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatTimeCell(day.timeIn)}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatTimeCell(day.timeOut)}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatWorkedDuration(day.regularMinutes)}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatWorkedDuration(day.overtimeMinutes)}
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge tone={day.isPaid ? "success" : "neutral"}>
                        {day.isPaid
                          ? day.paidDayUnits === 1
                            ? "Yes"
                            : `${formatPayrollDayUnits(day.paidDayUnits)} day`
                          : "No"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-[320px] align-top text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>{day.payReason}</p>
                        {day.holidayKind ? (
                          <p className="text-xs">
                            {formatBranchHolidayKindLabel(day.holidayKind)}
                            {" · "}
                            {day.holidayPayTreatment
                              ? formatBranchHolidayPayTreatmentLabel(day.holidayPayTreatment)
                              : "Not counted"}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manual adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.item.adjustments.length > 0 ? (
            <div className="space-y-3">
              {data.item.adjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{adjustment.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {adjustment.adjustmentType === "addition" ? "Addition" : "Deduction"}
                        {adjustment.notes ? ` · ${adjustment.notes}` : ""}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "font-semibold",
                        adjustment.adjustmentType === "addition"
                          ? "text-emerald-600"
                          : "text-amber-600",
                      )}
                    >
                      {adjustment.adjustmentType === "addition" ? "+" : "-"}
                      {formatCurrency(adjustment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No manual additions or deductions were applied to this payroll row.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className={cn("text-muted-foreground", labelClassName)}>{label}</p>
      <p className={cn("text-right font-medium text-foreground", valueClassName)}>{value}</p>
    </div>
  );
}

function formatTimeCell(value: string | null) {
  return value ? fromUtcIso(value).toFormat("hh:mm a") : "--";
}

function resolveDayStatusTone(statusLabel: string) {
  switch (statusLabel) {
    case "Present":
      return "success";
    case "Approved Leave":
      return "info";
    case "Worked During Approved Leave":
      return "warning";
    case "Late":
    case "Half day":
      return "warning";
    case "Absent":
      return "destructive";
    case "Branch Closed":
    case "Public Holiday":
    case "Company Holiday":
    case "Special Non-working Day":
      return "info";
    default:
      return "neutral";
  }
}
