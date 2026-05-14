import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
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
import { paginateItems } from "@/lib/pagination";

export function PayrollPageContent({
  data,
  periodPage,
  staffPage,
}: {
  data: PayrollPageData;
  periodPage?: string;
  staffPage?: string;
}) {
  const {
    filters,
    summary,
    payrollPeriods,
    compensationRoster,
    totalCompensationRosterCount,
    visibleCompensationRosterCount,
  } = data;
  const periodPagination = paginateItems(payrollPeriods, periodPage);
  const compensationPagination = paginateItems(compensationRoster, staffPage);

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
        description={`${periodPagination.totalItems} payroll period${
          periodPagination.totalItems === 1 ? "" : "s"
        } in the current view.`}
        action={<PayrollPeriodDialog />}
        toolbar={
          <DataTableFilters
            key={`${filters.periodSearch}:${filters.periodStatus}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            pageParamName="periodPage"
            search={{
              name: "periodSearch",
              value: filters.periodSearch,
              placeholder: "Search period label, notes, or date",
            }}
            filters={[
              {
                type: "select",
                name: "periodStatus",
                value: filters.periodStatus,
                options: [
                  { value: "", label: "All period statuses" },
                  ...PAYROLL_PERIOD_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={periodPagination.page}
            pageSize={periodPagination.pageSize}
            totalItems={periodPagination.totalItems}
            totalPages={periodPagination.totalPages}
            startItem={periodPagination.startItem}
            endItem={periodPagination.endItem}
            pageParamName="periodPage"
          />
        }
      >
        {periodPagination.totalItems === 0 ? (
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
                {periodPagination.items.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <TableCellLink href={`/payroll/${period.id}`} className="font-semibold text-foreground">
                        {period.label}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/payroll/${period.id}`} className="text-foreground">
                        {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/payroll/${period.id}`} className="text-foreground">
                        {formatDate(period.payoutDate)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/payroll/${period.id}`}>
                        <PayrollPeriodStatusBadge status={period.status} />
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                      <TableCellLink href={`/payroll/${period.id}`} className="line-clamp-2 text-foreground">
                        {period.notes?.trim() ? period.notes : "No notes"}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="text-right">
                      <TableRowActionsMenu label={`Payroll period actions for ${period.label}`}>
                        <TableRowActionsMenuLink href={`/payroll/${period.id}`} label="Open payroll period" />
                      </TableRowActionsMenu>
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
        description={`Showing ${compensationPagination.totalItems} of ${totalCompensationRosterCount} active staff records.`}
        toolbar={
          <DataTableFilters
            key={filters.staffSearch}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            pageParamName="staffPage"
            search={{
              name: "staffSearch",
              value: filters.staffSearch,
              placeholder: "Search staff name, role, or contact number",
            }}
          />
        }
        footer={
          <DataTablePagination
            page={compensationPagination.page}
            pageSize={compensationPagination.pageSize}
            totalItems={compensationPagination.totalItems}
            totalPages={compensationPagination.totalPages}
            startItem={compensationPagination.startItem}
            endItem={compensationPagination.endItem}
            pageParamName="staffPage"
          />
        }
      >
        {compensationPagination.totalItems === 0 ? (
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
                {compensationPagination.items.map((item) => (
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
                      <TableRowActionsMenu label={`Compensation actions for ${item.fullName}`}>
                        <StaffScheduleDialog
                          staffId={item.staffId}
                          staffName={item.fullName}
                          schedule={item.schedule}
                          trigger={({ openDialog }) => (
                            <TableRowActionsMenuButton label="Edit schedule" onSelect={openDialog} />
                          )}
                        />
                        <CompensationProfileDialog
                          staffId={item.staffId}
                          staffName={item.fullName}
                          profile={item.profile}
                          trigger={({ openDialog }) => (
                            <TableRowActionsMenuButton
                              label="Edit compensation"
                              onSelect={openDialog}
                            />
                          )}
                        />
                      </TableRowActionsMenu>
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
