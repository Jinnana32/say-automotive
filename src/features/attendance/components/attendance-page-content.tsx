"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceApprovalButton } from "@/features/attendance/components/attendance-approval-button";
import { ApprovedLeaveManagementSection } from "@/features/attendance/components/approved-leave-management-section";
import { AttendanceEntryDialog } from "@/features/attendance/components/attendance-entry-dialog";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import type { AttendancePageData } from "@/features/attendance/types";
import {
  ATTENDANCE_FILTER_OPTIONS,
  ATTENDANCE_ROLE_OPTIONS,
  canApproveAttendanceForLockedPeriod,
  canEditAttendanceForLockedPeriod,
  formatAttendanceApprovalLabel,
  formatAttendanceLockMessage,
  formatAttendanceStatusLabel,
  formatAttendanceTime,
  formatHolidayBannerLabel,
  formatLeaveDateRange,
  formatScheduleSummary,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
  getAttendanceApprovalTone,
  getAttendanceStatusTone,
  getDefaultAttendanceDate,
} from "@/features/attendance/utils";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function AttendancePageContent({ data }: { data: AttendancePageData }) {
  const searchParams = useSearchParams();
  const { leaveManagement, rosterData } = data;
  const { branchHoliday, filters, lockedPeriod, roster, summary, totalMatchingStaff, visibleCount } =
    rosterData;
  const today = getDefaultAttendanceDate();
  const showingFilteredRoster = visibleCount !== totalMatchingStaff;
  const rosterPagination = paginateItems(roster, searchParams.get("rosterPage") ?? undefined);
  const summaryCards = [
    {
      label: "Recorded",
      value: summary.recordedCount,
      helper: `${summary.unrecordedCount} still unrecorded`,
    },
    {
      label: "Approved",
      value: summary.approvedCount,
      helper: `${summary.recordedCount - summary.approvedCount} pending review`,
    },
    {
      label: "Schedules",
      value: summary.scheduleConfiguredCount,
      helper: `${summary.totalStaff - summary.scheduleConfiguredCount} missing schedule`,
    },
    {
      label: "Missing timeout",
      value: summary.missingTimeoutCount,
      helper: "Open shifts needing completion",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`Daily time record for ${formatDate(filters.date)}. Keep one attendance summary per active staff member, while holidays remove false payroll blockers. Use the approved leave tab for payroll exclusions.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/attendance/devices">Review devices</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/attendance/amendments">Review amendments</Link>
            </Button>
            {filters.date !== today ? (
              <Button asChild variant="outline">
                <Link href="/attendance">Today</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {lockedPeriod ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {formatAttendanceLockMessage(lockedPeriod)}
        </div>
      ) : null}

      {branchHoliday ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {formatHolidayBannerLabel(branchHoliday)}
          {branchHoliday.notes?.trim() ? ` · ${branchHoliday.notes}` : ""}
        </div>
      ) : null}

      <Tabs defaultValue="roster" className="space-y-6">
        <TabsList className="w-fit">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="leave">Approved leave</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} className="border-border/70 shadow-sm">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <DataTableFilters
                key={`${filters.search}:${filters.role}:${filters.status}:${filters.date}`}
                className="xl:grid xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]"
                pageParamName="rosterPage"
                search={{
                  value: filters.search,
                  placeholder: "Search by staff name or contact number",
                }}
                filters={[
                  {
                    type: "select",
                    name: "role",
                    value: filters.role,
                    options: [
                      { value: "", label: "All roles" },
                      ...ATTENDANCE_ROLE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                  {
                    type: "select",
                    name: "status",
                    value: filters.status,
                    options: [
                      { value: "", label: "All attendance states" },
                      ...ATTENDANCE_FILTER_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                  {
                    type: "date",
                    name: "date",
                    value: filters.date,
                  },
                ]}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <p>
                  Showing {rosterPagination.totalItems} staff member{rosterPagination.totalItems === 1 ? "" : "s"}
                  {showingFilteredRoster ? ` out of ${totalMatchingStaff} matching staff.` : "."}
                </p>
                <p>{summary.totalStaff} active staff included in this day&apos;s roster.</p>
              </div>

              {rosterPagination.totalItems === 0 ? (
                <EmptyState
                  title="No attendance roster found"
                  description="Try a different date or clear the current filters. Active staff will appear here even when no attendance has been recorded yet."
                />
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Time in</TableHead>
                        <TableHead>Time out</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rosterPagination.items.map((item) => (
                        <TableRow key={item.staffId}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{item.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.contactNumber ?? "No contact number"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatStaffRoleLabel(item.role)}
                          </TableCell>
                          <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <p>{formatScheduleSummary(item.schedule)}</p>
                              {item.schedule?.notes?.trim() ? (
                                <p className="line-clamp-2 text-xs">{item.schedule.notes}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <StatusBadge
                                tone={getAttendanceStatusTone(
                                  item.attendance?.status ?? "unrecorded",
                                )}
                              >
                                {formatAttendanceStatusLabel(item.attendance?.status ?? "unrecorded")}
                              </StatusBadge>
                              {item.leaveEntry ? (
                                <p className="text-xs font-medium text-sky-700">
                                  Approved leave · {formatStaffLeaveTypeLabel(item.leaveEntry.leaveType)} ·{" "}
                                  {formatLeaveDateRange(item.leaveEntry)}
                                </p>
                              ) : null}
                              {item.hasMissingTimeout ? (
                                <p className="text-xs font-medium text-amber-700">
                                  Time out still missing
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <StatusBadge tone={getAttendanceApprovalTone(item.attendance)}>
                                {formatAttendanceApprovalLabel(item.attendance)}
                              </StatusBadge>
                              {item.attendance?.approvedAt ? (
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(item.attendance.approvedAt)}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatAttendanceTime(item.attendance?.timeIn)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatAttendanceTime(item.attendance?.timeOut)}
                          </TableCell>
                          <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                            <span className="line-clamp-2">
                              {item.attendance?.notes?.trim() ? item.attendance.notes : "No notes"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <TableRowActionsMenu label={`Attendance actions for ${item.fullName}`}>
                              <StaffScheduleDialog
                                staffId={item.staffId}
                                staffName={item.fullName}
                                schedule={item.schedule}
                                trigger={({ openDialog }) => (
                                  <TableRowActionsMenuButton
                                    label="Edit schedule"
                                    onSelect={openDialog}
                                  />
                                )}
                              />
                              {item.attendance ? (
                                <AttendanceApprovalButton
                                  attendanceId={item.attendance.id}
                                  isApproved={item.isApproved}
                                  disabled={!canApproveAttendanceForLockedPeriod(lockedPeriod)}
                                  trigger={({ submit }) => (
                                    <TableRowActionsMenuButton
                                      label={
                                        item.isApproved ? "Remove approval" : "Approve attendance"
                                      }
                                      disabled={!canApproveAttendanceForLockedPeriod(lockedPeriod)}
                                      onSelect={submit}
                                    />
                                  )}
                                />
                              ) : null}
                              <AttendanceEntryDialog
                                staffId={item.staffId}
                                staffName={item.fullName}
                                attendanceDate={filters.date}
                                attendance={item.attendance}
                                disabled={!canEditAttendanceForLockedPeriod(lockedPeriod)}
                                trigger={({ openDialog }) => (
                                  <TableRowActionsMenuButton
                                    label="Edit attendance"
                                    disabled={!canEditAttendanceForLockedPeriod(lockedPeriod)}
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

              <DataTablePagination
                page={rosterPagination.page}
                pageSize={rosterPagination.pageSize}
                totalItems={rosterPagination.totalItems}
                totalPages={rosterPagination.totalPages}
                startItem={rosterPagination.startItem}
                endItem={rosterPagination.endItem}
                pageParamName="rosterPage"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <ApprovedLeaveManagementSection data={leaveManagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
