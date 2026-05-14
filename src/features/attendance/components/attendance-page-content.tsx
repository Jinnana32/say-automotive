"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceAmendmentsPageContent } from "@/features/attendance/components/attendance-amendments-page-content";
import { AttendanceDayRowActions } from "@/features/attendance/components/attendance-day-row-actions";
import { ApprovedLeaveManagementSection } from "@/features/attendance/components/approved-leave-management-section";
import { AttendanceRosterRowActions } from "@/features/attendance/components/attendance-roster-row-actions";
import type {
  AttendanceCalendarDaySummary,
  AttendanceCalendarStatus,
  AttendancePageData,
} from "@/features/attendance/types";
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
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function AttendancePageContent({ data }: { data: AttendancePageData }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leaveManagement, rosterData, attendanceData, attendanceCalendar, amendmentsReview } = data;
  const today = getDefaultAttendanceDate();
  const selectedDate = attendanceCalendar.selectedDate;
  const selectedDateLabel = formatDate(selectedDate);
  const activeTab = resolveAttendanceTab(searchParams.get("tab"));
  const selectedMonth = DateTime.fromISO(attendanceCalendar.monthStartDate);
  const yearOptions = buildYearOptions(selectedMonth.year, DateTime.fromISO(today).year);
  const calendarCells = buildCalendarCells(attendanceCalendar.days, attendanceCalendar.monthStartDate);
  const rosterPagination = paginateItems(
    rosterData.roster,
    searchParams.get("rosterPage") ?? undefined,
  );
  const attendancePagination = paginateItems(
    attendanceData.roster,
    searchParams.get("attendancePage") ?? undefined,
  );
  const showFilteredRoster = rosterData.visibleCount !== rosterData.totalMatchingStaff;
  const showFilteredAttendance =
    attendanceData.visibleCount !== attendanceData.totalMatchingStaff;
  const rosterCards = [
    {
      label: "Active staff",
      value: rosterData.summary.totalStaff,
      helper: `${rosterData.visibleCount} visible in the current roster view`,
    },
    {
      label: "Schedules configured",
      value: rosterData.summary.scheduleConfiguredCount,
      helper: `${rosterData.summary.totalStaff - rosterData.summary.scheduleConfiguredCount} still missing schedule`,
    },
    {
      label: "With approved leave",
      value: rosterData.roster.filter((item) => item.leaveEntry !== null).length,
      helper: `For ${selectedDateLabel}`,
    },
    {
      label: "Needs setup",
      value: rosterData.summary.totalStaff - rosterData.summary.scheduleConfiguredCount,
      helper: "Staff members that still need a shift template",
    },
  ];
  const attendanceCards = [
    {
      label: "Recorded",
      value: attendanceData.summary.recordedCount,
      helper: `${attendanceData.summary.unrecordedCount} still unrecorded`,
    },
    {
      label: "Approved",
      value: attendanceData.summary.approvedCount,
      helper: `${attendanceData.summary.recordedCount - attendanceData.summary.approvedCount} pending review`,
    },
    {
      label: "Missing timeout",
      value: attendanceData.summary.missingTimeoutCount,
      helper: "Open shifts needing completion",
    },
    {
      label: "Absent / unrecorded",
      value: attendanceData.summary.absentCount + attendanceData.summary.unrecordedCount,
      helper: `For ${selectedDateLabel}`,
    },
  ];

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function updateTab(nextTab: string) {
    updateParams((params) => {
      if (nextTab === "attendance") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }
    });
  }

  function updateSelectedDate(nextDate: string) {
    updateParams((params) => {
      params.set("date", nextDate);
      params.set("month", DateTime.fromISO(nextDate).toFormat("yyyy-LL"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  function navigateMonth(offset: number) {
    const nextMonth = selectedMonth.plus({ months: offset }).startOf("month");
    updateParams((params) => {
      params.set("month", nextMonth.toFormat("yyyy-LL"));
      params.set("date", nextMonth.toFormat("yyyy-LL-dd"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  function updateMonthSelection(nextMonth: number, nextYear: number) {
    const nextDate = DateTime.fromObject({ year: nextYear, month: nextMonth, day: 1 });

    if (!nextDate.isValid) {
      return;
    }

    updateParams((params) => {
      params.set("month", nextDate.toFormat("yyyy-LL"));
      params.set("date", nextDate.toFormat("yyyy-LL-dd"));
      params.delete("attendancePage");
      params.delete("rosterPage");
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`Daily time records and roster controls for ${selectedDateLabel}.`}
        actions={
          selectedDate !== today ? (
            <Button asChild variant="outline">
              <Link href="/attendance">Today</Link>
            </Button>
          ) : undefined
        }
      />

      {attendanceData.lockedPeriod ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {formatAttendanceLockMessage(attendanceData.lockedPeriod)}
        </div>
      ) : null}

      {attendanceData.branchHoliday ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {formatHolidayBannerLabel(attendanceData.branchHoliday)}
          {attendanceData.branchHoliday.notes?.trim()
            ? ` · ${attendanceData.branchHoliday.notes}`
            : ""}
        </div>
      ) : null}

      <Tabs
        defaultValue="attendance"
        value={activeTab}
        onValueChange={updateTab}
        className="space-y-6"
      >
        <TabsList className="w-fit flex-wrap">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="amendments">
            Review Amendments
            {amendmentsReview.pendingCount > 0 ? ` (${amendmentsReview.pendingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="leave">Approved leave</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {attendanceCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.helper}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-base font-semibold text-foreground">
                  Attendance calendar
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a date to review staff punches and attendance overrides.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Month
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {attendanceCalendar.monthLabel}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NativeSelect
                        aria-label="Select attendance month"
                        value={String(selectedMonth.month)}
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none"
                        onChange={(event) =>
                          updateMonthSelection(Number(event.target.value), selectedMonth.year)
                        }
                      >
                        {Array.from({ length: 12 }, (_, index) => {
                          const month = index + 1;

                          return (
                            <option key={month} value={month}>
                              {DateTime.fromObject({ year: 2026, month, day: 1 }).toFormat("LLLL")}
                            </option>
                          );
                        })}
                      </NativeSelect>
                      <NativeSelect
                        aria-label="Select attendance year"
                        value={String(selectedMonth.year)}
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none"
                        onChange={(event) =>
                          updateMonthSelection(selectedMonth.month, Number(event.target.value))
                        }
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10 rounded-full"
                      onClick={() => navigateMonth(-1)}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="sr-only">Previous month</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10 rounded-full"
                      onClick={() => navigateMonth(1)}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Next month</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((day, index) =>
                    day ? (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => updateSelectedDate(day.date)}
                        className={cn(
                          "relative flex aspect-square min-h-[3rem] flex-col items-center justify-center rounded-2xl border text-sm transition",
                          selectedDate === day.date
                            ? "border-brand-navy bg-brand-navy text-white shadow-[0_10px_24px_rgba(8,23,53,0.18)]"
                            : "border-border/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        <span className="font-semibold">
                          {DateTime.fromISO(day.date).toFormat("d")}
                        </span>
                        <span
                          className={cn(
                            "mt-1 size-2 rounded-full",
                            selectedDate === day.date ? "bg-white" : getCalendarStatusDotClass(day.status),
                          )}
                        />
                      </button>
                    ) : (
                      <div key={`blank-${index}`} className="aspect-square min-h-[3rem]" />
                    ),
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <LegendItem colorClass="bg-emerald-500" label="Present" />
                  <LegendItem colorClass="bg-amber-500" label="Incomplete" />
                  <LegendItem colorClass="bg-red-500" label="Absent" />
                  <LegendItem colorClass="bg-slate-300" label="No record" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">
                  {selectedDateLabel}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and correct staff punches for the selected date. Admin and owner accounts
                  are excluded from this operational attendance list.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <DataTableFilters
                  key={`${attendanceData.filters.search}:${attendanceData.filters.status}:${attendanceData.filters.date}`}
                  className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
                  pageParamName="attendancePage"
                  search={{
                    name: "attendanceSearch",
                    value: attendanceData.filters.search,
                    placeholder: "Search by staff name or contact number",
                  }}
                  filters={[
                    {
                      type: "select",
                      name: "attendanceStatus",
                      value: attendanceData.filters.status,
                      options: [
                        { value: "", label: "All attendance states" },
                        ...ATTENDANCE_FILTER_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        })),
                      ],
                    },
                  ]}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  <p>
                    Showing {attendancePagination.totalItems} staff member
                    {attendancePagination.totalItems === 1 ? "" : "s"}
                    {showFilteredAttendance
                      ? ` out of ${attendanceData.totalMatchingStaff} matching staff.`
                      : "."}
                  </p>
                  <p>
                    {attendanceData.summary.recordedCount} attendance records on {selectedDateLabel}
                  </p>
                </div>

                {attendancePagination.totalItems === 0 ? (
                  <EmptyState
                    title="No attendance entries found"
                    description="Try a different date or clear the current filters. Active staff will still appear here once they are expected on the selected day."
                  />
                ) : (
                  <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead>Time in</TableHead>
                          <TableHead>Time out</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendancePagination.items.map((item) => (
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
                            <TableCell>
                              <div className="space-y-2">
                                <StatusBadge
                                  tone={getAttendanceStatusTone(item.attendance?.status ?? "unrecorded")}
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
                              <AttendanceDayRowActions
                                attendance={item.attendance}
                                attendanceDate={attendanceData.filters.date}
                                canApprove={canApproveAttendanceForLockedPeriod(attendanceData.lockedPeriod)}
                                canEdit={canEditAttendanceForLockedPeriod(attendanceData.lockedPeriod)}
                                isApproved={item.isApproved}
                                staffId={item.staffId}
                                staffName={item.fullName}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <DataTablePagination
                  page={attendancePagination.page}
                  pageSize={attendancePagination.pageSize}
                  totalItems={attendancePagination.totalItems}
                  totalPages={attendancePagination.totalPages}
                  startItem={attendancePagination.startItem}
                  endItem={attendancePagination.endItem}
                  pageParamName="attendancePage"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roster" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rosterCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.helper}
              />
            ))}
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <DataTableFilters
                key={`${rosterData.filters.search}:${rosterData.filters.role}:${rosterData.filters.date}`}
                className="xl:grid xl:grid-cols-[minmax(0,1fr)_220px_180px]"
                pageParamName="rosterPage"
                search={{
                  name: "rosterSearch",
                  value: rosterData.filters.search,
                  placeholder: "Search by staff name or contact number",
                }}
                filters={[
                  {
                    type: "select",
                    name: "rosterRole",
                    value: rosterData.filters.role,
                    options: [
                      { value: "", label: "All roles" },
                      ...ATTENDANCE_ROLE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ],
                  },
                  {
                    type: "date",
                    name: "date",
                    value: rosterData.filters.date,
                  },
                ]}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <p>
                  Showing {rosterPagination.totalItems} staff member
                  {rosterPagination.totalItems === 1 ? "" : "s"}
                  {showFilteredRoster
                    ? ` out of ${rosterData.totalMatchingStaff} matching staff.`
                    : "."}
                </p>
                <p>{rosterData.summary.totalStaff} active staff included in this day&apos;s roster.</p>
              </div>

              {rosterPagination.totalItems === 0 ? (
                <EmptyState
                  title="No roster entries found"
                  description="Try a different date or clear the current filters. Active staff will appear here even before attendance is recorded."
                />
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Leave / exception</TableHead>
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
                          <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                            {item.leaveEntry ? (
                              <div className="space-y-1">
                                <p className="font-medium text-sky-700">
                                  {formatStaffLeaveTypeLabel(item.leaveEntry.leaveType)}
                                </p>
                                <p>{formatLeaveDateRange(item.leaveEntry)}</p>
                              </div>
                            ) : (
                              "No approved leave"
                            )}
                          </TableCell>
                          <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                            <span className="line-clamp-2">
                              {item.schedule?.notes?.trim() || item.leaveEntry?.notes?.trim() || "No notes"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <AttendanceRosterRowActions
                              staffId={item.staffId}
                              staffName={item.fullName}
                              schedule={item.schedule}
                            />
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

        <TabsContent value="amendments" className="space-y-6">
          <AttendanceAmendmentsPageContent
            data={amendmentsReview}
            embedded
            paramPrefix="amendment"
          />
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <ApprovedLeaveManagementSection data={leaveManagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", colorClass)} />
      <span>{label}</span>
    </div>
  );
}

function buildCalendarCells(
  days: AttendanceCalendarDaySummary[],
  monthStartDate: string,
) {
  const monthStart = DateTime.fromISO(monthStartDate);
  const leadingEmptyDays = monthStart.isValid ? monthStart.weekday % 7 : 0;
  const cells: Array<AttendanceCalendarDaySummary | null> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null);
  }

  return [...cells, ...days];
}

function buildYearOptions(selectedYear: number, currentYear: number) {
  const startYear = Math.min(selectedYear, currentYear) - 1;
  const endYear = Math.max(selectedYear, currentYear) + 1;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

function getCalendarStatusDotClass(status: AttendanceCalendarStatus) {
  switch (status) {
    case "complete":
      return "bg-emerald-500";
    case "attention":
      return "bg-amber-500";
    case "absent":
      return "bg-red-500";
    case "none":
      return "bg-slate-300";
  }
}

function resolveAttendanceTab(tab: string | null) {
  if (tab === "roster" || tab === "amendments" || tab === "leave") {
    return tab;
  }

  return "attendance";
}
