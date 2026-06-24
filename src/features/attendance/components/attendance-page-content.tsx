"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
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
  AttendancePageData,
  BranchHolidaySummary,
} from "@/features/attendance/types";
import {
  ATTENDANCE_FILTER_OPTIONS,
  ATTENDANCE_ROLE_OPTIONS,
  canEditAttendanceForLockedPeriod,
  formatAttendanceLockMessage,
  formatAttendanceStatusLabel,
  formatAttendanceTime,
  formatBranchHolidayKindLabel,
  formatBranchHolidayPayTreatmentLabel,
  formatBranchHolidayStatusLabel,
  formatHolidayBannerLabel,
  formatLeaveDateRange,
  formatScheduleSummary,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
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
  const feedbackError = searchParams.get("error");
  const selectedMonth = DateTime.fromISO(attendanceCalendar.monthStartDate);
  const isBranchHolidayDate = attendanceData.branchHoliday !== null;
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
      helper: isBranchHolidayDate
        ? "Real punch records still appear on non-working branch dates"
        : `${attendanceData.summary.unrecordedCount} still unrecorded`,
    },
    {
      label: "Schedules configured",
      value: attendanceData.summary.scheduleConfiguredCount,
      helper: `${attendanceData.summary.totalStaff - attendanceData.summary.scheduleConfiguredCount} staff still missing schedule setup`,
    },
    {
      label: "Missing timeout",
      value: attendanceData.summary.missingTimeoutCount,
      helper: isBranchHolidayDate
        ? "Not treated as a blocker on branch closures or holidays"
        : "Open shifts needing completion",
    },
    {
      label: "Absent / unrecorded",
      value: attendanceData.summary.absentCount + attendanceData.summary.unrecordedCount,
      helper: isBranchHolidayDate
        ? "No attendance required for this branch calendar date"
        : `For ${selectedDateLabel}`,
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
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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

      <FormStatusMessage message={feedbackError ?? undefined} />

      {attendanceData.lockedPeriod ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {formatAttendanceLockMessage(attendanceData.lockedPeriod)}
        </div>
      ) : null}

      {attendanceData.branchHoliday ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            getBranchHolidayPanelClass(attendanceData.branchHoliday),
          )}
        >
          <p className="font-semibold">
            {formatBranchHolidayStatusLabel(attendanceData.branchHoliday)}
          </p>
          <p className="mt-1">
            {selectedDateLabel}
            {attendanceData.branchName ? ` · ${attendanceData.branchName}` : ""}
          </p>
          <p className="mt-1">
            {attendanceData.branchHoliday.holidayKind === "branch_closure" ? "Reason" : "Event"}:{" "}
            {formatHolidayBannerLabel(attendanceData.branchHoliday)}
          </p>
          <p className="mt-1">
            Pay treatment: {formatBranchHolidayPayTreatmentLabel(attendanceData.branchHoliday.payTreatment)}
          </p>
          <p className="mt-1">No attendance required for this date.</p>
          {attendanceData.branchHoliday.notes?.trim() ? (
            <p className="mt-1">{attendanceData.branchHoliday.notes}</p>
          ) : null}
        </div>
      ) : null}

      <Tabs
        defaultValue="attendance"
        value={activeTab}
        onValueChange={updateTab}
        className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden"
      >
        <TabsList className="w-full max-w-full flex-wrap xl:w-fit">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="amendments">
            Review Amendments
            {amendmentsReview.pendingCount > 0 ? ` (${amendmentsReview.pendingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="leave">Approved leave</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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

          <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="min-w-0 border-border/70 shadow-sm">
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
                            : getCalendarStatusCellClass(day),
                        )}
                        aria-label={buildAttendanceCalendarDayAriaLabel(day)}
                      >
                        <span className="font-semibold">
                          {DateTime.fromISO(day.date).toFormat("d")}
                        </span>
                        <span
                          className={cn(
                            "mt-1 size-2 rounded-full",
                            selectedDate === day.date ? "bg-white" : getCalendarStatusDotClass(day),
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
                  <LegendItem colorClass="bg-sky-500" label="Branch closure" />
                  <LegendItem colorClass="bg-violet-500" label="Public / company holiday" />
                  <LegendItem colorClass="bg-amber-400" label="Special non-working day" />
                  <LegendItem colorClass="bg-slate-300" label="No record / rest day" />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-border/70 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">
                  {selectedDateLabel}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and correct staff punches for the selected date. Admin and owner accounts
                  are excluded from this operational attendance list.
                </p>
              </CardHeader>
              <CardContent className="min-w-0 space-y-4 p-6">
                <DataTableFilters
                  key={`${attendanceData.filters.search}:${attendanceData.filters.status}:${attendanceData.filters.date}`}
                  className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_220px]"
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

                {attendanceData.branchHoliday ? (
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm",
                      getBranchHolidayPanelClass(attendanceData.branchHoliday),
                    )}
                  >
                    <p>
                      {formatBranchHolidayStatusLabel(attendanceData.branchHoliday)} on this date. Attendance is not required. Real punch records will still appear below.
                    </p>
                    <p className="mt-1">
                      Pay treatment: {formatBranchHolidayPayTreatmentLabel(attendanceData.branchHoliday.payTreatment)}
                    </p>
                  </div>
                ) : null}

                {attendancePagination.totalItems === 0 ? (
                  <EmptyState
                    title="No attendance entries found"
                    description="Try a different date or clear the current filters. Active staff will still appear here once they are expected on the selected day."
                  />
                ) : (
                  <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70">
                    <div className="min-w-0 max-w-full overflow-x-auto">
                      <Table className="min-w-[640px] table-auto [&_th]:px-4 [&_th]:tracking-[0.12em] [&_td]:px-4 [&_td]:py-5 2xl:min-w-[920px] 2xl:[&_th]:px-5 2xl:[&_th]:tracking-[0.16em] 2xl:[&_td]:px-5">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[220px] 2xl:min-w-[280px]">Staff</TableHead>
                            <TableHead className="min-w-[180px] 2xl:min-w-[220px]">Status</TableHead>
                            <TableHead className="min-w-[170px] 2xl:hidden">Time</TableHead>
                            <TableHead className="hidden min-w-[148px] whitespace-nowrap 2xl:table-cell">Time in</TableHead>
                            <TableHead className="hidden min-w-[148px] whitespace-nowrap 2xl:table-cell">Time out</TableHead>
                            <TableHead className="w-[72px] min-w-[72px] px-4 text-right 2xl:px-5">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendancePagination.items.map((item) => (
                            <TableRow key={item.staffId}>
                              <TableCell className="min-w-[220px] align-top 2xl:min-w-[280px]">
                                <div className="space-y-1">
                                  <p className="break-words font-semibold leading-snug text-foreground">
                                    {item.fullName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatStaffRoleLabel(item.role)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.contactNumber ?? "No contact number"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[180px] align-top 2xl:min-w-[220px]">
                                <div className="space-y-1.5">
                                  {attendanceData.branchHoliday && !item.attendance ? (
                                    <StatusBadge
                                      tone="neutral"
                                      className={getBranchHolidayBadgeClass(attendanceData.branchHoliday)}
                                    >
                                      {formatBranchHolidayStatusLabel(attendanceData.branchHoliday)}
                                    </StatusBadge>
                                  ) : (
                                    <StatusBadge
                                      tone={getAttendanceStatusTone(item.attendance?.status ?? "unrecorded")}
                                    >
                                      {formatAttendanceStatusLabel(item.attendance?.status ?? "unrecorded")}
                                    </StatusBadge>
                                  )}
                                  {attendanceData.branchHoliday && item.attendance ? (
                                    <p className="text-xs font-medium text-sky-700">
                                      Worked during {formatBranchHolidayKindLabel(attendanceData.branchHoliday.holidayKind).toLowerCase()}
                                    </p>
                                  ) : null}
                                  {item.leaveEntry ? (
                                    <p className="text-xs font-medium text-sky-700">
                                      Approved leave · {formatStaffLeaveTypeLabel(item.leaveEntry.leaveType)} ·{" "}
                                      {formatLeaveDateRange(item.leaveEntry)}
                                    </p>
                                  ) : null}
                                  {item.hasMissingTimeout && !attendanceData.branchHoliday ? (
                                    <p className="text-xs font-medium text-amber-700">
                                      Time out still missing
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[170px] align-top text-sm text-muted-foreground 2xl:hidden">
                                <div className="space-y-1">
                                  <p className="leading-none">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                      In:
                                    </span>{" "}
                                    <span>{formatAttendanceTableTime(item.attendance?.timeIn)}</span>
                                  </p>
                                  <p className="leading-none">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                      Out:
                                    </span>{" "}
                                    <span>{formatAttendanceTableTime(item.attendance?.timeOut)}</span>
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden min-w-[148px] whitespace-nowrap align-top text-sm text-muted-foreground 2xl:table-cell">
                                {formatAttendanceTableTime(item.attendance?.timeIn)}
                              </TableCell>
                              <TableCell className="hidden min-w-[148px] whitespace-nowrap align-top text-sm text-muted-foreground 2xl:table-cell">
                                {formatAttendanceTableTime(item.attendance?.timeOut)}
                              </TableCell>
                              <TableCell className="w-[72px] min-w-[72px] px-4 align-top text-right 2xl:px-5">
                                <AttendanceDayRowActions
                                  attendance={item.attendance}
                                  attendanceDate={attendanceData.filters.date}
                                  canEdit={canEditAttendanceForLockedPeriod(attendanceData.lockedPeriod)}
                                  staffId={item.staffId}
                                  staffName={item.fullName}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

        <TabsContent value="roster" className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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

          <Card className="min-w-0 border-border/70 shadow-sm">
            <CardContent className="min-w-0 space-y-4 p-6">
                <DataTableFilters
                  key={`${rosterData.filters.search}:${rosterData.filters.role}:${rosterData.filters.date}`}
                  className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_220px_180px]"
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

              {rosterData.branchHoliday ? (
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm",
                    getBranchHolidayPanelClass(rosterData.branchHoliday),
                  )}
                >
                  <p>
                    {formatBranchHolidayStatusLabel(rosterData.branchHoliday)}. No attendance required for this date.
                  </p>
                  <p className="mt-1">
                    Pay treatment: {formatBranchHolidayPayTreatmentLabel(rosterData.branchHoliday.payTreatment)}
                  </p>
                </div>
              ) : null}

              {rosterPagination.totalItems === 0 ? (
                <EmptyState
                  title="No roster entries found"
                  description="Try a different date or clear the current filters. Active staff will appear here even before attendance is recorded."
                />
              ) : (
                <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border/70">
                  <div className="min-w-0 max-w-full overflow-x-auto">
                    <Table className="min-w-[860px] xl:min-w-0">
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
                              {rosterData.branchHoliday ? (
                                <div className="space-y-1">
                                  <p className={cn("font-medium", getBranchHolidayTextClass(rosterData.branchHoliday))}>
                                    {item.attendance
                                      ? `${formatBranchHolidayStatusLabel(rosterData.branchHoliday)} · attendance recorded`
                                      : formatBranchHolidayStatusLabel(rosterData.branchHoliday)}
                                  </p>
                                  <p>
                                    {formatHolidayBannerLabel(rosterData.branchHoliday)} · Pay treatment:{" "}
                                    {formatBranchHolidayPayTreatmentLabel(rosterData.branchHoliday.payTreatment)}
                                  </p>
                                </div>
                              ) : item.leaveEntry ? (
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
                                {item.schedule?.notes?.trim()
                                  || item.leaveEntry?.notes?.trim()
                                  || rosterData.branchHoliday?.notes?.trim()
                                  || "No notes"}
                              </span>
                            </TableCell>
                            <TableCell className="w-14 px-2 text-right">
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

        <TabsContent value="amendments" className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
          <AttendanceAmendmentsPageContent
            data={amendmentsReview}
            embedded
            paramPrefix="amendment"
          />
        </TabsContent>

        <TabsContent value="leave" className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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

function getCalendarStatusDotClass(day: AttendanceCalendarDaySummary) {
  if (day.branchHoliday) {
    return getBranchHolidayDotClass(day.branchHoliday);
  }

  switch (day.status) {
    case "complete":
      return "bg-emerald-500";
    case "attention":
      return "bg-amber-500";
    case "absent":
      return "bg-red-500";
    case "holiday":
    case "none":
      return "bg-slate-300";
  }
}

function getCalendarStatusCellClass(day: AttendanceCalendarDaySummary) {
  if (day.branchHoliday) {
    return getBranchHolidayCellClass(day.branchHoliday);
  }

  switch (day.status) {
    default:
      return "border-border/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  }
}

function formatAttendanceTableTime(value: string | null | undefined) {
  return value ? formatAttendanceTime(value) : "--";
}

function formatAttendanceTableNote(
  attendanceNote: string | null | undefined,
  branchHolidayNote: string | null | undefined,
) {
  return attendanceNote?.trim() || branchHolidayNote?.trim() || "--";
}

function getBranchHolidayDotClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "bg-sky-500";
    case "public_holiday":
    case "company_holiday":
      return "bg-violet-500";
    case "special_non_working_day":
      return "bg-amber-400";
  }
}

function getBranchHolidayCellClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300 hover:bg-sky-100";
    case "public_holiday":
    case "company_holiday":
      return "border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-300 hover:bg-violet-100";
    case "special_non_working_day":
      return "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100";
  }
}

function getBranchHolidayPanelClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "public_holiday":
    case "company_holiday":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "special_non_working_day":
      return "border-amber-200 bg-amber-50 text-amber-900";
  }
}

function getBranchHolidayBadgeClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "border-transparent bg-sky-100 text-sky-800";
    case "public_holiday":
    case "company_holiday":
      return "border-transparent bg-violet-100 text-violet-800";
    case "special_non_working_day":
      return "border-transparent bg-amber-100 text-amber-800";
  }
}

function getBranchHolidayTextClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "text-sky-700";
    case "public_holiday":
    case "company_holiday":
      return "text-violet-700";
    case "special_non_working_day":
      return "text-amber-700";
  }
}

function buildAttendanceCalendarDayAriaLabel(day: AttendanceCalendarDaySummary) {
  const formattedDate = DateTime.fromISO(day.date).toFormat("LLLL d, yyyy");

  if (day.branchHoliday) {
    return `${formattedDate}. ${formatBranchHolidayStatusLabel(day.branchHoliday)}. ${day.branchHoliday.label}. Pay treatment: ${formatBranchHolidayPayTreatmentLabel(day.branchHoliday.payTreatment)}. No attendance required.`;
  }

  return `${formattedDate}. ${day.staffCount} staff tracked.`;
}

function resolveAttendanceTab(tab: string | null) {
  if (tab === "roster" || tab === "amendments" || tab === "leave") {
    return tab;
  }

  return "attendance";
}
