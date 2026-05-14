"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import {
  ChevronLeft,
  ChevronRight,
  FileClock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import { MechanicPortalSectionIntro } from "@/features/attendance/components/mechanic-portal-section-intro";
import type {
  MechanicPortalHistoryCalendarStatus,
  MechanicPortalHistoryDay,
  MechanicPortalHistoryPageData,
} from "@/features/attendance/types";
import {
  buildDtrAmendmentFormValues,
  formatAttendanceTime,
  formatDtrAmendmentStatusLabel,
  formatDtrAmendmentTypeLabel,
  formatLeaveDateRange,
  formatStaffLeaveTypeLabel,
} from "@/features/attendance/utils";
import { formatDate, fromUtcIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function MechanicPortalHistoryPage({
  data,
}: {
  data: MechanicPortalHistoryPageData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => data.initialSelectedDate);
  const activeMonth = DateTime.fromISO(data.monthStartDate);
  const selectedMonthValue = activeMonth.month;
  const selectedYearValue = activeMonth.year;
  const yearOptions = buildYearOptions(selectedYearValue, DateTime.fromISO(data.todayDate).year);

  const calendarCells = buildCalendarCells(data.days, data.monthStartDate);
  const selectedDay = data.days.find((item) => item.date === selectedDate) ?? data.days[0] ?? null;
  const monthHasRecords = data.days.some(
    (item) => item.attendance !== null || item.amendments.length > 0,
  );

  function navigateMonth(offset: number) {
    const nextMonth = activeMonth.plus({ months: offset }).toFormat("yyyy-LL");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateMonthSelection(nextMonth: number, nextYear: number) {
    const nextDate = DateTime.fromObject({
      year: nextYear,
      month: nextMonth,
      day: 1,
    });

    if (!nextDate.isValid) {
      return;
    }

    const nextMonthKey = nextDate.toFormat("yyyy-LL");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonthKey);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <MechanicPortalSectionIntro
        eyebrow="History"
        title="Attendance calendar"
        description="Review your daily attendance records and DTR amendments."
      />

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-4 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Month
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{data.monthLabel}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NativeSelect
                aria-label="Select attendance month"
                value={String(selectedMonthValue)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none"
                onChange={(event) =>
                  updateMonthSelection(Number(event.target.value), selectedYearValue)
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
                value={String(selectedYearValue)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none"
                onChange={(event) =>
                  updateMonthSelection(selectedMonthValue, Number(event.target.value))
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
              className="size-10 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {calendarCells.map((day, index) =>
            day ? (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "relative flex aspect-square min-h-[3rem] flex-col items-center justify-center rounded-2xl border text-sm transition",
                  selectedDate === day.date
                    ? "border-[#081735] bg-[#081735] text-white shadow-[0_10px_24px_rgba(8,23,53,0.2)]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  day.date === data.todayDate && selectedDate !== day.date
                    ? "border-[#D62828]/40"
                    : "",
                )}
              >
                <span className="font-semibold">
                  {DateTime.fromISO(day.date).toFormat("d")}
                </span>
                <span
                  className={cn(
                    "mt-1 size-2 rounded-full",
                    selectedDate === day.date
                      ? "bg-white"
                      : getCalendarStatusDotClass(day.calendarStatus),
                  )}
                />
              </button>
            ) : (
              <div key={`blank-${index}`} className="aspect-square min-h-[3rem]" />
            ),
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <LegendItem colorClass="bg-emerald-500" label="Present" />
          <LegendItem colorClass="bg-amber-500" label="Incomplete" />
          <LegendItem colorClass="bg-red-500" label="Absent" />
          <LegendItem colorClass="bg-slate-300" label="No record" />
        </div>

        {!monthHasRecords ? (
          <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
            No attendance records found for this month.
          </div>
        ) : null}
      </section>

      {selectedDay ? (
        <SelectedAttendanceDetailCard
          day={selectedDay}
          allowDtrAmendments={data.settings.allowDtrAmendments}
        />
      ) : null}
    </div>
  );
}

function SelectedAttendanceDetailCard({
  day,
  allowDtrAmendments,
}: {
  day: MechanicPortalHistoryDay;
  allowDtrAmendments: boolean;
}) {
  const latestAmendment = day.amendments[0] ?? null;
  const detailStatusLabel = getDetailStatusLabel(day);
  const detailStatusTone = getDetailStatusTone(day);
  const totalHours = getAttendanceTotalHours(day);
  const sourceLabel = getAttendanceSourceLabel(day);
  const networkLabel = getAttendanceVerificationLabel(day.timeLogs, "network");
  const deviceLabel = getAttendanceVerificationLabel(day.timeLogs, "device");
  const canFileAmendment =
    allowDtrAmendments &&
    !day.isFuture &&
    (day.calendarStatus === "incomplete" || day.calendarStatus === "absent") &&
    latestAmendment?.status !== "pending" &&
    latestAmendment?.status !== "approved";

  return (
    <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Selected date
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{formatDate(day.date)}</h2>
        </div>
        <StatusBadge tone={detailStatusTone}>{detailStatusLabel}</StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DetailMetric label="Time in" value={formatAttendanceTime(day.attendance?.timeIn)} />
        <DetailMetric label="Time out" value={formatAttendanceTime(day.attendance?.timeOut)} />
        <DetailMetric label="Total" value={totalHours} />
        <DetailMetric label="Source" value={sourceLabel} />
      </div>

      <div className="mt-4 space-y-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4">
        <DetailRow
          icon={<ShieldCheck className="size-4 text-emerald-600" />}
          label="Network"
          value={networkLabel}
        />
        <DetailRow
          icon={<Smartphone className="size-4 text-[#081735]" />}
          label="Device"
          value={deviceLabel}
        />
        {latestAmendment ? (
          <DetailRow
            icon={<FileClock className="size-4 text-[#D62828]" />}
            label="Amendment"
            value={`${formatDtrAmendmentStatusLabel(latestAmendment.status)} · ${formatDtrAmendmentTypeLabel(latestAmendment.amendmentType)}`}
          />
        ) : null}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        {day.isFuture ? (
          <p>Attendance is not available for future dates.</p>
        ) : day.attendance === null && day.calendarStatus === "absent" ? (
          <p>No attendance record for this date.</p>
        ) : day.attendance === null && day.leaveEntry ? (
          <p>
            On approved leave: {formatStaffLeaveTypeLabel(day.leaveEntry.leaveType)} ·{" "}
            {formatLeaveDateRange(day.leaveEntry)}
          </p>
        ) : day.attendance === null && day.isBranchHoliday ? (
          <p>No attendance required because this date is marked as a branch holiday.</p>
        ) : day.attendance === null && day.calendarStatus === "none" ? (
          <p>No attendance record for this date.</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {latestAmendment ? (
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-[1.2rem] border-[#0B1F4D]/20 text-sm font-semibold text-[#0B1F4D] hover:bg-[#EAF1FB]"
          >
            <Link href="/portal/amendments">
              {latestAmendment.status === "approved"
                ? "View approved amendment"
                : latestAmendment.status === "pending"
                  ? "View amendment"
                  : "View amendment history"}
            </Link>
          </Button>
        ) : null}

        {canFileAmendment ? (
          <ModalDialog
            title="File DTR amendment"
            description="Request a correction for the selected attendance date."
            trigger={({ openDialog }) => (
              <Button
                type="button"
                variant={latestAmendment ? "outline" : "default"}
                className={cn(
                  "h-12 rounded-[1.2rem] text-sm font-semibold",
                  latestAmendment
                    ? "border-[#0B1F4D]/20 text-[#0B1F4D] hover:bg-[#EAF1FB]"
                    : "bg-[#081735] text-white hover:bg-[#0B1F4D]",
                )}
                onClick={openDialog}
              >
                File DTR amendment
              </Button>
            )}
          >
            {({ closeDialog }) => (
              <DtrAmendmentForm
                initialValues={buildDtrAmendmentFormValues(
                  day.date,
                  getAmendmentTargetLogType(day),
                )}
                closeDialog={closeDialog}
              />
            )}
          </ModalDialog>
        ) : null}
      </div>
    </section>
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

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function buildCalendarCells(days: MechanicPortalHistoryDay[], monthStartDate: string) {
  const monthStart = DateTime.fromISO(monthStartDate);
  const leadingBlankCount = monthStart.weekday % 7;

  return [
    ...Array.from({ length: leadingBlankCount }, () => null),
    ...days,
  ] as Array<MechanicPortalHistoryDay | null>;
}

function buildYearOptions(selectedYear: number, currentYear: number) {
  const startYear = Math.min(selectedYear, currentYear) - 2;
  const endYear = Math.max(selectedYear, currentYear) + 2;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

function getCalendarStatusDotClass(status: MechanicPortalHistoryCalendarStatus) {
  switch (status) {
    case "present":
      return "bg-emerald-500";
    case "incomplete":
      return "bg-amber-500";
    case "absent":
      return "bg-red-500";
    case "none":
      return "bg-slate-300";
  }
}

function getDetailStatusLabel(day: MechanicPortalHistoryDay) {
  if (day.isFuture) {
    return "Future";
  }

  if (day.amendments.some((item) => item.status === "pending")) {
    return "Pending amendment";
  }

  if (day.attendance?.status === "late") {
    return "Late";
  }

  if (day.attendance?.status === "half_day") {
    return "Half day";
  }

  if (day.attendance?.status === "absent" || day.calendarStatus === "absent") {
    return "Absent";
  }

  if (day.calendarStatus === "incomplete") {
    return "Incomplete";
  }

  if (day.calendarStatus === "present") {
    return "Present";
  }

  if (day.leaveEntry) {
    return "On leave";
  }

  if (day.isBranchHoliday) {
    return "Holiday";
  }

  return "No record";
}

function getDetailStatusTone(day: MechanicPortalHistoryDay) {
  if (day.isFuture) {
    return "neutral" as const;
  }

  if (day.amendments.some((item) => item.status === "pending") || day.calendarStatus === "incomplete") {
    return "warning" as const;
  }

  if (day.attendance?.status === "absent" || day.calendarStatus === "absent") {
    return "destructive" as const;
  }

  if (day.calendarStatus === "present") {
    return "success" as const;
  }

  return "neutral" as const;
}

function getAttendanceTotalHours(day: MechanicPortalHistoryDay) {
  if (!day.attendance?.timeIn || !day.attendance.timeOut) {
    return "—";
  }

  const timeIn = fromUtcIso(day.attendance.timeIn);
  const timeOut = fromUtcIso(day.attendance.timeOut);
  const diff = timeOut.diff(timeIn, ["hours", "minutes"]).toObject();
  const hours = Math.floor(diff.hours ?? 0);
  const minutes = Math.floor(diff.minutes ?? 0);

  return `${hours}h ${minutes}m`;
}

function getAttendanceSourceLabel(day: MechanicPortalHistoryDay) {
  if (day.timeLogs.some((item) => item.source === "admin_approved_amendment")) {
    return "Approved DTR amendment";
  }

  if (day.timeLogs.some((item) => item.source === "admin_override")) {
    return "Admin override";
  }

  if (day.timeLogs.some((item) => item.source === "mechanic_portal")) {
    return "Mechanic Portal";
  }

  return "—";
}

function getAttendanceVerificationLabel(
  timeLogs: MechanicPortalHistoryDay["timeLogs"],
  mode: "network" | "device",
) {
  if (timeLogs.length === 0) {
    return "—";
  }

  const values =
    mode === "network"
      ? timeLogs.map((item) => item.isShopIpValid)
      : timeLogs.map((item) => item.isDeviceApproved);

  if (values.every(Boolean)) {
    return mode === "network" ? "Approved shop IP" : "Approved device";
  }

  if (values.some(Boolean)) {
    return "Mixed verification";
  }

  return "Needs review";
}

function getAmendmentTargetLogType(day: MechanicPortalHistoryDay) {
  if (day.attendance?.timeIn && !day.attendance.timeOut) {
    return "time_out" as const;
  }

  return "time_in" as const;
}
