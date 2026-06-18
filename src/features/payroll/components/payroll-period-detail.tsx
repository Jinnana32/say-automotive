import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GeneratePayrollCutButton } from "@/features/payroll/components/generate-payroll-cut-button";
import { PayrollPeriodItemAdjustmentsDialog } from "@/features/payroll/components/payroll-period-item-adjustments-dialog";
import { PayrollPeriodItemBreakdownDrawer } from "@/features/payroll/components/payroll-period-item-breakdown-drawer";
import { PayrollPeriodStatusBadge } from "@/features/payroll/components/payroll-period-status-badge";
import { PayrollPeriodStatusForm } from "@/features/payroll/components/payroll-period-status-form";
import type { PayrollPeriodDetailData } from "@/features/payroll/types";
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
import { formatDate, formatDateTime } from "@/lib/dates";

export function PayrollPeriodDetail({ data }: { data: PayrollPeriodDetailData }) {
  const { period, settings, summary, items } = data;
  const hasGeneratedCut = Boolean(period.generatedAt && items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={period.label}
        description={`Coverage ${formatPayrollCoverage(period.periodStartDate, period.periodEndDate)} · payout ${formatDate(period.payoutDate)}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/payroll">Back to payroll</Link>
            </Button>
            {hasGeneratedCut ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/payroll/${period.id}/print`} target="_blank">
                    Print summary
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={`/api/payroll/${period.id}/pdf`}>Download PDF</a>
                </Button>
              </>
            ) : null}
            <PayrollPeriodStatusBadge status={period.status} />
          </div>
        }
      />

      <MetricGrid className="xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Staff in cut"
          value={String(summary.totalStaffCount)}
          description="Payroll-eligible staff included in this generated cut"
        />
        <StatCard
          title="Net payout"
          value={formatCurrency(summary.totalNetPay)}
          description="Current payout after manual additions and deductions"
        />
        <StatCard
          title="Base pay"
          value={formatCurrency(summary.totalBasePay)}
          description="Computed from paid day units before late deductions"
        />
        <StatCard
          title="Late deductions"
          value={formatCurrency(summary.totalLateDeductions)}
          description="Prorated missed-time deductions from late arrivals"
          tone={summary.totalLateDeductions > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Holiday + overtime"
          value={formatCurrency(summary.totalHolidayPremiumPay + summary.totalOvertimePay)}
          description={`Holiday premium ${settings.holidayPremiumRate * 100}% · ${settings.standardDailyHours}h standard day`}
        />
        <StatCard
          title="Warnings"
          value={String(summary.warningStaffCount)}
          description={`${summary.openShiftCount} open shift · ${summary.missingAttendanceCount} missing attendance`}
          tone={summary.warningStaffCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Worked hours"
          value={formatWorkedDuration(summary.totalWorkedMinutes)}
          description="Captured attendance hours in this payroll coverage"
        />
      </MetricGrid>

      <SectionCard
        title="Payroll cut control"
        description="Generate the payroll summary first, review warnings and manual adjustments, then lock the period for payout review or finalize it once ready."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Coverage window {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}</p>
            <p>Payout date {formatDate(period.payoutDate)}</p>
            <p>Created {formatDateTime(period.createdAt)}</p>
            {period.generatedAt ? <p>Last generated {formatDateTime(period.generatedAt)}</p> : null}
            {period.finalizedAt ? <p>Finalized {formatDateTime(period.finalizedAt)}</p> : null}
            <p>
              Payroll math uses {settings.standardDailyHours} standard hours per day and a{" "}
              {Math.round(settings.holidayPremiumRate * 10000) / 100}% holiday premium on worked holiday dates.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 px-4 py-4">
            <GeneratePayrollCutButton
              periodId={period.id}
              hasGeneratedCut={hasGeneratedCut}
              disabled={period.status === "finalized"}
            />
            <PayrollPeriodStatusForm
              periodId={period.id}
              currentStatus={period.status}
              hasGeneratedCut={hasGeneratedCut}
            />
          </div>
        </div>
      </SectionCard>

      <DataTableCard
        title="Payroll summary"
        description={`${items.length} payroll row${items.length === 1 ? "" : "s"} shown. Warnings stay visible for review, but the cut itself is the primary workflow now.`}
      >
        {items.length === 0 ? (
          <EmptyState
            title="No payroll cut generated yet"
            description="Generate the payroll cut for this period to compute payout rows, apply manual deductions, and print the summary."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1260px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Pay basis</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Adjustments</TableHead>
                  <TableHead>Net pay</TableHead>
                  <TableHead>Warnings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <PayrollPeriodItemBreakdownDrawer periodId={period.id} item={item} />
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.role.replaceAll("_", " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {item.payBasis ? formatPayBasisLabel(item.payBasis) : "Not configured"}
                        </p>
                        <p>
                          {item.baseRate !== null ? formatCurrency(item.baseRate) : "—"}
                          {item.allowancePerPeriod > 0
                            ? ` · Allowance ${formatCurrency(item.allowancePerPeriod)}`
                            : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>
                          {formatPayrollDayUnits(item.paidDayUnits)} paid day
                          {item.paidDayUnits === 1 ? "" : "s"}
                        </p>
                        <p>
                          Attended {getPayrollAttendedDayCount(item)} · Late {item.lateCount} · Half {item.halfDayCount} · Absent {item.absentCount}
                        </p>
                        <p>
                          {formatWorkedDuration(item.workedMinutes)}
                          {item.overtimeMinutes > 0
                            ? ` · OT ${formatWorkedDuration(item.overtimeMinutes)}`
                            : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>Daily {formatCurrency(item.dailyRateUsed)}</p>
                        <p>Hourly {formatCurrency(item.hourlyRateUsed)}</p>
                        {item.lateDeductionMinutes > 0 ? (
                          <p>Late minutes {item.lateDeductionMinutes}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>Base {formatCurrency(item.basePay)}</p>
                        {item.lateDeductionAmount > 0 ? (
                          <p>Late -{formatCurrency(item.lateDeductionAmount)}</p>
                        ) : null}
                        {item.holidayPremiumPay > 0 ? (
                          <p>Holiday +{formatCurrency(item.holidayPremiumPay)}</p>
                        ) : null}
                        {item.overtimePay > 0 ? (
                          <p>OT +{formatCurrency(item.overtimePay)}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>Add {formatCurrency(item.manualAdditionsTotal)}</p>
                        <p>Less {formatCurrency(item.manualDeductionsTotal)}</p>
                        <p>{item.adjustments.length} manual item{item.adjustments.length === 1 ? "" : "s"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{formatCurrency(item.netPay)}</p>
                        <p className="text-sm text-muted-foreground">
                          Gross {formatCurrency(item.grossPay)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <div className="space-y-2">
                        <StatusBadge tone={getPayrollReadinessTone(item.readinessStatus)}>
                          {formatPayrollReadinessLabel(item.readinessStatus)}
                        </StatusBadge>
                        {item.warningCodes.length > 0 ? (
                          <div className="space-y-1">
                            {item.warningCodes.map((warningCode) => (
                              <p key={`${item.id}-${warningCode}`}>{formatPayrollWarningLabel(warningCode)}</p>
                            ))}
                          </div>
                        ) : (
                          <p>Ready for payout review.</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <PayrollPeriodItemAdjustmentsDialog item={item} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
