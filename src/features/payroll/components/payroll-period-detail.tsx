import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { formatScheduleSummary } from "@/features/attendance/utils";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import { CompensationProfileDialog } from "@/features/payroll/components/compensation-profile-dialog";
import { PayrollPeriodStatusBadge } from "@/features/payroll/components/payroll-period-status-badge";
import { PayrollPeriodStatusForm } from "@/features/payroll/components/payroll-period-status-form";
import type { PayrollPeriodDetailData } from "@/features/payroll/types";
import {
  formatPayBasisLabel,
  formatPayrollCoverage,
  formatPayrollReadinessLabel,
  formatWorkedDuration,
  getPayrollReadinessTone,
} from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export function PayrollPeriodDetail({ data }: { data: PayrollPeriodDetailData }) {
  const { period, summary, staffSummaries } = data;
  const canFinalize = summary.blockedStaffCount === 0;

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
            <PayrollPeriodStatusBadge status={period.status} />
          </div>
        }
      />

      <MetricGrid className="xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Staff with activity"
          value={String(summary.staffWithActivityCount)}
          description="Active staff who recorded attendance in this period"
        />
        <StatCard
          title="Ready"
          value={String(summary.readyStaffCount)}
          description="Staff with compensation and complete DTR"
          badge={`${summary.blockedStaffCount} blocked`}
          tone={summary.blockedStaffCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Compensation"
          value={String(summary.configuredStaffCount)}
          description="Active staff with a compensation profile"
        />
        <StatCard
          title="Schedules"
          value={String(summary.scheduledStaffCount)}
          description="Active staff with a weekly schedule"
          badge={`${summary.missingScheduleCount} missing`}
          tone={summary.missingScheduleCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Attendance gaps"
          value={String(summary.missingAttendanceCount)}
          description="Scheduled workdays with no DTR record"
          badge={`${summary.openShiftCount} open shift`}
          tone={summary.missingAttendanceCount > 0 || summary.openShiftCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Pending review"
          value={String(summary.pendingApprovalCount)}
          description="Attendance records not yet approved"
        />
        <StatCard
          title="Worked hours"
          value={formatWorkedDuration(summary.totalWorkedMinutes)}
          description="Captured attendance hours for this coverage"
        />
      </MetricGrid>

      <SectionCard
        title="Period control"
        description="Finalization now depends on configured schedules, compensation, and full attendance coverage for scheduled workdays. Processing periods lock DTR edits while review and approval continue."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Coverage window {formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}</p>
            <p>Payout date {formatDate(period.payoutDate)}</p>
            <p>Created {formatDateTime(period.createdAt)}</p>
            {period.finalizedAt ? <p>Finalized {formatDateTime(period.finalizedAt)}</p> : null}
          </div>
          <PayrollPeriodStatusForm
            periodId={period.id}
            currentStatus={period.status}
            canFinalize={canFinalize}
          />
        </div>
      </SectionCard>

      <DataTableCard
        title="Staff readiness"
        description={`${staffSummaries.length} active staff shown. Blockers are sorted to the top.`}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff member</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Worked hours</TableHead>
                <TableHead>Status mix</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffSummaries.map((item) => (
                <TableRow key={item.staffId}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{item.fullName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {item.role.replaceAll("_", " ")}
                        {item.contactNumber ? ` · ${item.contactNumber}` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>{formatScheduleSummary(item.schedule)}</p>
                        <p>
                          {item.expectedWorkdayCount} expected day{item.expectedWorkdayCount === 1 ? "" : "s"}
                          {item.scheduledWorkdayCount > 0
                            ? ` · ${item.scheduledWorkdayCount} scheduled`
                            : ""}
                          {item.holidayDayCount > 0 ? ` · ${item.holidayDayCount} holiday` : ""}
                          {item.approvedLeaveDayCount > 0
                            ? ` · ${item.approvedLeaveDayCount} leave`
                            : ""}
                          {item.missingAttendanceDayCount > 0
                            ? ` · ${item.missingAttendanceDayCount} missing`
                            : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.compensationProfile ? (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {formatPayBasisLabel(item.compensationProfile.payBasis)}
                        </p>
                        <p>
                          {formatCurrency(item.compensationProfile.baseRate)}
                          {item.compensationProfile.allowancePerPeriod > 0
                            ? ` · Allowance ${formatCurrency(item.compensationProfile.allowancePerPeriod)}`
                            : ""}
                        </p>
                      </div>
                    ) : (
                      "Not configured"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>{item.recordedDays} recorded day{item.recordedDays === 1 ? "" : "s"}</p>
                      <p>
                        {item.hadAttendanceActivity ? "Attendance captured" : "No attendance activity"}
                        {item.pendingApprovalCount > 0 ? ` · ${item.pendingApprovalCount} pending` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatWorkedDuration(item.workedMinutes)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>
                        P {item.presentCount} · L {item.lateCount} · H {item.halfDayCount} · A {item.absentCount}
                      </p>
                      {item.missingTimeoutCount > 0 ? (
                        <p className="font-medium text-amber-700">
                          {item.missingTimeoutCount} missing time out
                        </p>
                      ) : null}
                      {item.approvedCount > 0 ? (
                        <p className="text-xs">Approved {item.approvedCount}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={getPayrollReadinessTone(item.readinessStatus)}>
                      {formatPayrollReadinessLabel(item.readinessStatus)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <TableRowActionsMenu label={`Staff readiness actions for ${item.fullName}`}>
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
                        profile={item.compensationProfile}
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
      </DataTableCard>
    </div>
  );
}
