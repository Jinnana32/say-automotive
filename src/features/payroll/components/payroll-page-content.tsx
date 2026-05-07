import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatScheduleSummary } from "@/features/attendance/utils";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import { CompensationProfileDialog } from "@/features/payroll/components/compensation-profile-dialog";
import { PayrollPeriodDialog } from "@/features/payroll/components/payroll-period-dialog";
import { PayrollPeriodStatusBadge } from "@/features/payroll/components/payroll-period-status-badge";
import type { PayrollPageData } from "@/features/payroll/types";
import {
  PAYROLL_PERIOD_STATUS_OPTIONS,
  formatPayBasisLabel,
  formatPayrollCoverage,
} from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function PayrollPageContent({ data }: { data: PayrollPageData }) {
  const { filters, summary, payrollPeriods, compensationRoster, totalCompensationRosterCount, visibleCompensationRosterCount } =
    data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Compensation setup and payroll period readiness built on top of attendance, without turning payroll into hardcoded assumptions too early."
      />

      <MetricGrid>
        <StatCard
          title="Active staff"
          value={String(summary.activeStaffCount)}
          description="Current staff roster eligible for compensation setup"
        />
        <StatCard
          title="Compensation ready"
          value={String(summary.compensatedStaffCount)}
          description="Staff with a compensation profile already configured"
          badge={`${summary.missingCompensationCount} missing`}
          tone={summary.missingCompensationCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Schedules ready"
          value={String(summary.scheduledStaffCount)}
          description="Staff with a weekly work schedule configured"
          badge={`${summary.missingScheduleCount} missing`}
          tone={summary.missingScheduleCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Payroll periods"
          value={String(summary.payrollPeriodCount)}
          description="Coverage windows created so far"
          badge={`${summary.processingPeriodCount} processing`}
          tone={summary.processingPeriodCount > 0 ? "info" : "neutral"}
        />
        <StatCard
          title="Finalized periods"
          value={String(summary.finalizedPeriodCount)}
          description="Locked payroll periods"
          badge={`${summary.draftPeriodCount} draft`}
          tone={summary.finalizedPeriodCount > 0 ? "success" : "neutral"}
        />
      </MetricGrid>

      <DataTableCard
        title="Payroll periods"
        description={`${payrollPeriods.length} payroll period${payrollPeriods.length === 1 ? "" : "s"} in the current view.`}
        action={<PayrollPeriodDialog />}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[220px_auto_auto]">
              <NativeSelect name="periodStatus" defaultValue={filters.periodStatus}>
                <option value="">All period statuses</option>
                {PAYROLL_PERIOD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/payroll">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >
        {payrollPeriods.length === 0 ? (
          <EmptyState
            title="No payroll periods yet"
            description="Create the first payroll period so attendance and compensation can be reviewed against a real coverage window."
            action={<PayrollPeriodDialog />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Payout date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-semibold">{period.label}</TableCell>
                    <TableCell>{formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}</TableCell>
                    <TableCell>{formatDate(period.payoutDate)}</TableCell>
                    <TableCell>
                      <PayrollPeriodStatusBadge status={period.status} />
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                      <span className="line-clamp-2">{period.notes?.trim() ? period.notes : "No notes"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/payroll/${period.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>

      <DataTableCard
        title="Compensation setup"
        description={`Showing ${visibleCompensationRosterCount} of ${totalCompensationRosterCount} active staff records.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <SearchInput
                type="search"
                name="staffSearch"
                defaultValue={filters.staffSearch}
                placeholder="Search staff name, role, or contact number"
              />
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/payroll">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >
        {compensationRoster.length === 0 ? (
          <EmptyState
            title="No staff match the current search"
            description="Try a different name or clear the compensation search filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Pay basis</TableHead>
                  <TableHead>Base rate</TableHead>
                  <TableHead>Allowance</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compensationRoster.map((item) => (
                  <TableRow key={item.staffId}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{item.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.contactNumber ?? "No contact number"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {item.role.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>{formatScheduleSummary(item.schedule)}</p>
                        {item.schedule?.notes?.trim() ? (
                          <p className="line-clamp-2 text-xs">{item.schedule.notes}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.profile ? formatPayBasisLabel(item.profile.payBasis) : "Not configured"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.profile ? formatCurrency(item.profile.baseRate) : "Not configured"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.profile ? formatCurrency(item.profile.allowancePerPeriod) : "Not configured"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.profile ? formatDate(item.profile.effectiveStartDate) : "Not configured"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <StaffScheduleDialog
                          staffId={item.staffId}
                          staffName={item.fullName}
                          schedule={item.schedule}
                        />
                        <CompensationProfileDialog
                          staffId={item.staffId}
                          staffName={item.fullName}
                          profile={item.profile}
                        />
                      </div>
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
