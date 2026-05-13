import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { DataTableCard } from "@/components/shared/data-table-card";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceAccessSettingsForm } from "@/features/attendance/components/attendance-access-settings-form";
import { AttendanceAllowedIpForm } from "@/features/attendance/components/attendance-allowed-ip-form";
import { AttendanceAllowedIpRowActions } from "@/features/attendance/components/attendance-allowed-ip-row-actions";
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
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/attendance/devices">
                Review devices
                {data.pendingDeviceCount > 0 ? ` (${data.pendingDeviceCount})` : ""}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/attendance/amendments">
                Review DTR amendments
                {data.pendingAmendmentCount > 0 ? ` (${data.pendingAmendmentCount})` : ""}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">
              Mechanic portal access
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Control whether mechanic attendance must come from the approved shop network and whether amendment fallback stays available.
            </p>
          </CardHeader>
          <CardContent>
            <AttendanceAccessSettingsForm initialValues={data.attendanceAccessSettings} />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">
              Approved shop IPs
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Attendance punches are treated as on-site only when the current public internet IP
              matches one of these branch addresses.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Detected public IP
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {data.currentDetectedIp ?? "Unable to detect"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this to register the current branch connection after confirming you are
                  on-site. Do not use a local Wi-Fi address like 192.168.x.x here.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pending amendments
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {data.pendingAmendmentCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Requests waiting for attendance review and payroll readiness.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pending devices
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {data.pendingDeviceCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New mechanic phones and browsers waiting for approval.
                </p>
              </div>
            </div>

            <AttendanceAllowedIpForm currentDetectedIp={data.currentDetectedIp} />

            {data.allowedIpAddresses.length === 0 ? (
              <EmptyState
                title="No allowed shop IPs yet"
                description="Mechanic punches will fail network validation until at least one approved branch IP is added."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP address</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.allowedIpAddresses.map((allowedIp) => (
                      <TableRow key={allowedIp.id}>
                        <TableCell className="font-medium text-foreground">
                          {allowedIp.ipAddress}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {allowedIp.label?.trim() || "No label"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(allowedIp.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <AttendanceAllowedIpRowActions allowedIp={allowedIp} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
