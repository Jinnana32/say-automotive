import { EmptyState } from "@/components/shared/empty-state";
import { DataTableCard } from "@/components/shared/data-table-card";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import { BranchHolidayRowActions } from "@/features/attendance/components/branch-holiday-row-actions";
import { StaffLeaveDialog } from "@/features/attendance/components/staff-leave-dialog";
import { StaffLeaveRowActions } from "@/features/attendance/components/staff-leave-row-actions";
import type { TimekeepingCalendarPageData } from "@/features/attendance/types";
import {
  formatBranchHolidayKindLabel,
  formatLeaveDateRange,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
  getInclusiveDayCount,
} from "@/features/attendance/utils";
import { formatDate, getBusinessNow } from "@/lib/dates";

export function TimekeepingCalendarPageContent({
  data,
}: {
  data: TimekeepingCalendarPageData;
}) {
  const today = getBusinessNow().toFormat("yyyy-LL-dd");
  const upcomingHolidayCount = data.holidays.filter((holiday) => holiday.holidayDate >= today).length;
  const activeLeaveCount = data.leaveEntries.filter((entry) => entry.endDate >= today).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timekeeping Calendar"
        description="Manage branch holidays and approved leave so attendance and payroll only expect DTR on real workdays."
      />

      <MetricGrid className="xl:grid-cols-4">
        <StatCard
          title="Branch"
          value={data.branchName}
          description="Current calendar scope for attendance and payroll"
        />
        <StatCard
          title="Holiday dates"
          value={String(data.holidays.length)}
          description="Configured branch non-working dates"
          badge={`${upcomingHolidayCount} upcoming`}
          tone={upcomingHolidayCount > 0 ? "info" : "neutral"}
        />
        <StatCard
          title="Approved leave entries"
          value={String(data.leaveEntries.length)}
          description="Stored leave windows that exclude expected attendance"
          badge={`${activeLeaveCount} active`}
          tone={activeLeaveCount > 0 ? "info" : "neutral"}
        />
        <StatCard
          title="Active staff"
          value={String(data.activeStaff.length)}
          description="Selectable for approved leave encoding"
        />
      </MetricGrid>

      <DataTableCard
        title="Branch holidays"
        description="These dates remove expected attendance for the whole branch."
        action={<BranchHolidayDialog />}
      >
        {data.holidays.length === 0 ? (
          <EmptyState
            title="No branch holidays yet"
            description="Add official holidays or planned branch closures so payroll does not treat those dates as missing attendance."
            action={<BranchHolidayDialog />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium text-foreground">
                      {formatDate(holiday.holidayDate)}
                    </TableCell>
                    <TableCell>{holiday.label}</TableCell>
                    <TableCell>
                      <StatusBadge tone="info">
                        {formatBranchHolidayKindLabel(holiday.holidayKind)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                      <span className="line-clamp-2">
                        {holiday.notes?.trim() ? holiday.notes : "No notes"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <BranchHolidayRowActions holiday={holiday} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>

      <DataTableCard
        title="Approved leave"
        description="Approved leave is staff-specific and only excludes scheduled workdays in the covered range."
        action={<StaffLeaveDialog activeStaff={data.activeStaff} />}
      >
        {data.leaveEntries.length === 0 ? (
          <EmptyState
            title="No approved leave entries yet"
            description="Encode leave here once it is approved so attendance gaps and payroll blockers stay accurate."
            action={<StaffLeaveDialog activeStaff={data.activeStaff} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Leave type</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leaveEntries.map((leaveEntry) => (
                  <TableRow key={leaveEntry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{leaveEntry.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          {leaveEntry.staffRole ? formatStaffRoleLabel(leaveEntry.staffRole) : "Unknown role"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone="warning">
                        {formatStaffLeaveTypeLabel(leaveEntry.leaveType)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLeaveDateRange(leaveEntry)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getInclusiveDayCount(leaveEntry.startDate, leaveEntry.endDate)}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                      <span className="line-clamp-2">
                        {leaveEntry.notes?.trim() ? leaveEntry.notes : "No notes"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <StaffLeaveRowActions
                        leaveEntry={leaveEntry}
                        activeStaff={data.activeStaff}
                      />
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
