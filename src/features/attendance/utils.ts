import { DateTime } from "luxon";

import { getBusinessNow, fromUtcIso } from "@/lib/dates";
import type { StaffRole } from "@/lib/auth/permissions";
import type {
  AttendanceAccessSettings,
  AttendanceDateLockSummary,
  AttendanceDailySummary,
  AttendanceEntryActionState,
  AttendanceFilterStatus,
  AttendanceFormValues,
  AttendanceLogType,
  AttendancePageFilters,
  AttendanceRecordSummary,
  AttendanceRosterItem,
  AttendanceStatus,
  BranchHolidayFormValues,
  BranchHolidayKind,
  BranchHolidaySummary,
  DtrAmendmentFormValues,
  DtrAmendmentStatus,
  DtrAmendmentSummary,
  DtrAmendmentType,
  MechanicPortalIpStatus,
  StaffLeaveEntrySummary,
  StaffLeaveFormValues,
  StaffLeaveType,
  StaffScheduleFormValues,
  StaffScheduleSummary,
} from "@/features/attendance/types";

export const ATTENDANCE_STATUS_VALUES = ["present", "late", "half_day", "absent"] as const;

export const ATTENDANCE_STATUS_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
  { value: "absent", label: "Absent" },
];

export const ATTENDANCE_FILTER_OPTIONS: Array<{
  value: AttendanceFilterStatus;
  label: string;
}> = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
  { value: "absent", label: "Absent" },
  { value: "missing_timeout", label: "Missing timeout" },
  { value: "unrecorded", label: "No record" },
];

export const ATTENDANCE_ROLE_OPTIONS: Array<{
  value: StaffRole;
  label: string;
}> = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "mechanic", label: "Mechanic" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory_staff", label: "Inventory staff" },
  { value: "service_advisor", label: "Service advisor" },
];

export const BRANCH_HOLIDAY_KIND_OPTIONS: Array<{
  value: BranchHolidayKind;
  label: string;
}> = [
  { value: "regular", label: "Regular holiday" },
  { value: "special", label: "Special non-working" },
  { value: "branch_closure", label: "Branch closure" },
  { value: "other", label: "Other" },
];

export const STAFF_LEAVE_TYPE_OPTIONS: Array<{
  value: StaffLeaveType;
  label: string;
}> = [
  { value: "vacation", label: "Vacation leave" },
  { value: "sick", label: "Sick leave" },
  { value: "emergency", label: "Emergency leave" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "other", label: "Other leave" },
];

export const ATTENDANCE_LOG_TYPE_OPTIONS: Array<{
  value: AttendanceLogType;
  label: string;
}> = [
  { value: "time_in", label: "Time in" },
  { value: "time_out", label: "Time out" },
];

export const DTR_AMENDMENT_TYPE_OPTIONS: Array<{
  value: DtrAmendmentType;
  label: string;
}> = [
  { value: "missed_time_in", label: "Missed time in" },
  { value: "missed_time_out", label: "Missed time out" },
  { value: "wrong_time", label: "Wrong time" },
  { value: "shop_network_issue", label: "Shop network issue" },
  { value: "other", label: "Other" },
];

export const INITIAL_ATTENDANCE_ENTRY_ACTION_STATE: AttendanceEntryActionState = {
  status: "idle",
};
export const INITIAL_TIMEKEEPING_ACTION_STATE = INITIAL_ATTENDANCE_ENTRY_ACTION_STATE;

const SCHEDULE_DAY_DEFINITIONS = [
  { key: "mondayIsWorkday", shortLabel: "Mon", luxonWeekday: 1 },
  { key: "tuesdayIsWorkday", shortLabel: "Tue", luxonWeekday: 2 },
  { key: "wednesdayIsWorkday", shortLabel: "Wed", luxonWeekday: 3 },
  { key: "thursdayIsWorkday", shortLabel: "Thu", luxonWeekday: 4 },
  { key: "fridayIsWorkday", shortLabel: "Fri", luxonWeekday: 5 },
  { key: "saturdayIsWorkday", shortLabel: "Sat", luxonWeekday: 6 },
  { key: "sundayIsWorkday", shortLabel: "Sun", luxonWeekday: 7 },
] as const;

export function getDefaultAttendanceDate() {
  return getBusinessNow().toFormat("yyyy-LL-dd");
}

export function resolveAttendancePageFilters(params: {
  date?: string;
  search?: string;
  role?: string;
  status?: string;
}): AttendancePageFilters {
  return {
    date: isIsoDate(params.date) ? params.date : getDefaultAttendanceDate(),
    search: params.search?.trim() ?? "",
    role: isStaffRole(params.role) ? params.role : "",
    status: isAttendanceFilterStatus(params.status) ? params.status : "",
  };
}

export function formatAttendanceStatusLabel(status: AttendanceStatus | AttendanceFilterStatus) {
  switch (status) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "half_day":
      return "Half day";
    case "absent":
      return "Absent";
    case "missing_timeout":
      return "Missing timeout";
    case "unrecorded":
      return "No record";
  }
}

export function getAttendanceStatusTone(status: AttendanceStatus | AttendanceFilterStatus) {
  switch (status) {
    case "present":
      return "success";
    case "late":
    case "missing_timeout":
      return "warning";
    case "half_day":
      return "info";
    case "absent":
      return "destructive";
    case "unrecorded":
      return "neutral";
  }
}

export function formatStaffRoleLabel(role: StaffRole) {
  return role
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatAttendanceTime(value: string | null | undefined) {
  if (!value) {
    return "Not logged";
  }

  return fromUtcIso(value).toFormat("hh:mm a");
}

export function toAttendanceDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return fromUtcIso(value).toFormat("yyyy-LL-dd'T'HH:mm");
}

export function buildAttendanceFormValues({
  staffId,
  attendanceDate,
  attendance,
}: {
  staffId: string;
  attendanceDate: string;
  attendance: AttendanceRecordSummary | null;
}): AttendanceFormValues {
  return {
    staffId,
    attendanceDate,
    status: attendance?.status ?? "present",
    timeIn: toAttendanceDateTimeInputValue(attendance?.timeIn),
    timeOut: toAttendanceDateTimeInputValue(attendance?.timeOut),
    notes: attendance?.notes ?? "",
  };
}

export function buildStaffScheduleFormValues(
  staffId: string,
  schedule: StaffScheduleSummary | null,
): StaffScheduleFormValues {
  return {
    staffId,
    shiftStartTime: schedule?.shiftStartTime ?? "08:00",
    shiftEndTime: schedule?.shiftEndTime ?? "17:00",
    graceMinutes: schedule ? String(schedule.graceMinutes) : "0",
    mondayIsWorkday: schedule?.mondayIsWorkday ?? false,
    tuesdayIsWorkday: schedule?.tuesdayIsWorkday ?? false,
    wednesdayIsWorkday: schedule?.wednesdayIsWorkday ?? false,
    thursdayIsWorkday: schedule?.thursdayIsWorkday ?? false,
    fridayIsWorkday: schedule?.fridayIsWorkday ?? false,
    saturdayIsWorkday: schedule?.saturdayIsWorkday ?? false,
    sundayIsWorkday: schedule?.sundayIsWorkday ?? false,
    notes: schedule?.notes ?? "",
  };
}

export function buildBranchHolidayFormValues(
  holiday: BranchHolidaySummary | null,
): BranchHolidayFormValues {
  return {
    holidayId: holiday?.id ?? "",
    holidayDate: holiday?.holidayDate ?? getDefaultAttendanceDate(),
    label: holiday?.label ?? "",
    holidayKind: holiday?.holidayKind ?? "regular",
    notes: holiday?.notes ?? "",
  };
}

export function buildStaffLeaveFormValues(
  staffId: string,
  leaveEntry: StaffLeaveEntrySummary | null,
): StaffLeaveFormValues {
  const defaultDate = getDefaultAttendanceDate();

  return {
    leaveEntryId: leaveEntry?.id ?? "",
    staffId: leaveEntry?.staffId ?? staffId,
    startDate: leaveEntry?.startDate ?? defaultDate,
    endDate: leaveEntry?.endDate ?? defaultDate,
    leaveType: leaveEntry?.leaveType ?? "vacation",
    notes: leaveEntry?.notes ?? "",
  };
}

export function buildDtrAmendmentFormValues(
  attendanceDate: string,
  targetLogType: AttendanceLogType = "time_in",
): DtrAmendmentFormValues {
  return {
    attendanceDate,
    targetLogType,
    amendmentType: targetLogType === "time_out" ? "missed_time_out" : "missed_time_in",
    requestedTime: getBusinessNow().toFormat("HH:mm"),
    reason: "",
  };
}

export function hasMissingTimeout(attendance: AttendanceRecordSummary | null) {
  return Boolean(attendance?.timeIn && !attendance.timeOut);
}

export function isAttendanceApproved(attendance: AttendanceRecordSummary | null) {
  return Boolean(attendance?.approvedAt);
}

export function formatAttendanceApprovalLabel(attendance: AttendanceRecordSummary | null) {
  if (!attendance) {
    return "No record";
  }

  return isAttendanceApproved(attendance) ? "Approved" : "Pending review";
}

export function getAttendanceApprovalTone(attendance: AttendanceRecordSummary | null) {
  if (!attendance) {
    return "neutral";
  }

  return isAttendanceApproved(attendance) ? "success" : "warning";
}

export function formatAttendanceLogTypeLabel(value: AttendanceLogType) {
  return ATTENDANCE_LOG_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatDtrAmendmentTypeLabel(value: DtrAmendmentType) {
  return DTR_AMENDMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatDtrAmendmentStatusLabel(value: DtrAmendmentStatus) {
  switch (value) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

export function getDtrAmendmentStatusTone(value: DtrAmendmentStatus) {
  switch (value) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
  }
}

export function formatMechanicIpStatusMessage(
  ipStatus: MechanicPortalIpStatus,
  settings: AttendanceAccessSettings,
) {
  if (!settings.requireShopIpForMechanicAttendance) {
    return "Shop network validation is disabled. Portal punches are currently allowed from any connection.";
  }

  if (ipStatus.isAllowed) {
    const matchedLabel = ipStatus.matchedAllowedIp?.label?.trim();
    return matchedLabel
      ? `Connected to the approved shop network via ${matchedLabel}.`
      : "Connected to the approved shop network.";
  }

  return "You are not connected to the approved shop network. Time-in/time-out is only allowed on-site. If this is a valid attendance issue, file a DTR amendment for admin approval.";
}

export function getMechanicPortalPrimaryLogType(
  attendance: AttendanceRecordSummary | null,
): AttendanceLogType | null {
  if (!attendance || !attendance.timeIn) {
    return "time_in";
  }

  if (!attendance.timeOut) {
    return "time_out";
  }

  return null;
}

export function getMechanicPortalPrimaryActionLabel(
  attendance: AttendanceRecordSummary | null,
) {
  const nextLogType = getMechanicPortalPrimaryLogType(attendance);

  if (nextLogType === "time_in") {
    return "Clock In";
  }

  if (nextLogType === "time_out") {
    return "Clock Out";
  }

  return "Attendance complete";
}

export function formatMechanicAttendanceState(
  attendance: AttendanceRecordSummary | null,
  amendments: DtrAmendmentSummary[],
) {
  const pendingAmendment = amendments.find((item) => item.status === "pending");

  if (pendingAmendment) {
    return "Pending DTR amendment";
  }

  if (!attendance?.timeIn) {
    return "Not timed in";
  }

  if (attendance.timeIn && !attendance.timeOut) {
    return `Timed in at ${formatAttendanceTime(attendance.timeIn)}`;
  }

  if (attendance.timeOut) {
    return `Timed out at ${formatAttendanceTime(attendance.timeOut)}`;
  }

  return "Attendance updated";
}

export function formatAttendanceLockMessage(lock: AttendanceDateLockSummary) {
  return lock.payrollPeriodStatus === "finalized"
    ? `This attendance date is locked because payroll period ${lock.payrollPeriodLabel} is finalized.`
    : `This attendance date is locked for edits because payroll period ${lock.payrollPeriodLabel} is in processing.`;
}

export function canEditAttendanceForLockedPeriod(lock: AttendanceDateLockSummary | null) {
  return lock === null;
}

export function canApproveAttendanceForLockedPeriod(lock: AttendanceDateLockSummary | null) {
  return lock === null || lock.payrollPeriodStatus === "processing";
}

export function formatScheduleSummary(schedule: StaffScheduleSummary | null) {
  if (!schedule) {
    return "No schedule";
  }

  const activeDays = SCHEDULE_DAY_DEFINITIONS.filter((day) => schedule[day.key]);

  if (activeDays.length === 0) {
    return "No workdays selected";
  }

  return `${activeDays.map((day) => day.shortLabel).join(" · ")} · ${formatScheduleTimeRange(schedule)}`;
}

export function formatBranchHolidayKindLabel(kind: BranchHolidayKind) {
  return BRANCH_HOLIDAY_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? kind;
}

export function formatStaffLeaveTypeLabel(type: StaffLeaveType) {
  return STAFF_LEAVE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function formatLeaveDateRange(leaveEntry: Pick<StaffLeaveEntrySummary, "startDate" | "endDate">) {
  if (leaveEntry.startDate === leaveEntry.endDate) {
    return DateTime.fromISO(leaveEntry.startDate).toFormat("LLL dd, yyyy");
  }

  return `${DateTime.fromISO(leaveEntry.startDate).toFormat("LLL dd")} - ${DateTime.fromISO(
    leaveEntry.endDate,
  ).toFormat("LLL dd, yyyy")}`;
}

export function formatScheduleTimeRange(schedule: StaffScheduleSummary) {
  const shiftStart =
    DateTime.fromFormat(schedule.shiftStartTime, "HH:mm:ss").isValid
      ? DateTime.fromFormat(schedule.shiftStartTime, "HH:mm:ss")
      : DateTime.fromFormat(schedule.shiftStartTime, "HH:mm");
  const shiftEnd =
    DateTime.fromFormat(schedule.shiftEndTime, "HH:mm:ss").isValid
      ? DateTime.fromFormat(schedule.shiftEndTime, "HH:mm:ss")
      : DateTime.fromFormat(schedule.shiftEndTime, "HH:mm");

  if (!shiftStart.isValid || !shiftEnd.isValid) {
    return `${schedule.shiftStartTime} - ${schedule.shiftEndTime}`;
  }

  return `${shiftStart.toFormat("hh:mm a")} - ${shiftEnd.toFormat("hh:mm a")}`;
}

export function deriveAttendanceStatusFromTimeIn({
  schedule,
  timeInUtcIso,
}: {
  schedule: StaffScheduleSummary | null;
  timeInUtcIso: string;
}): AttendanceStatus {
  if (!schedule) {
    return "present";
  }

  const localizedTimeIn = fromUtcIso(timeInUtcIso);
  const shiftStart = resolveScheduleTimeForDate(schedule.shiftStartTime, localizedTimeIn);

  if (!shiftStart.isValid) {
    return "present";
  }

  return localizedTimeIn > shiftStart.plus({ minutes: schedule.graceMinutes })
    ? "late"
    : "present";
}

export function countScheduledWorkdays(
  schedule: StaffScheduleSummary | null,
  startDate: string,
  endDate: string,
) {
  if (!schedule) {
    return 0;
  }

  let cursor = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  let count = 0;

  while (cursor.isValid && end.isValid && cursor <= end) {
    const matchedDay = SCHEDULE_DAY_DEFINITIONS.find((day) => day.luxonWeekday === cursor.weekday);

    if (matchedDay && schedule[matchedDay.key]) {
      count += 1;
    }

    cursor = cursor.plus({ days: 1 });
  }

  return count;
}

export function getInclusiveDayCount(startDate: string, endDate: string) {
  const start = DateTime.fromISO(startDate).startOf("day");
  const end = DateTime.fromISO(endDate).startOf("day");

  if (!start.isValid || !end.isValid || end < start) {
    return 0;
  }

  return Math.floor(end.diff(start, "days").days) + 1;
}

export function doesLeaveCoverDate(
  leaveEntry: Pick<StaffLeaveEntrySummary, "startDate" | "endDate">,
  date: string,
) {
  return leaveEntry.startDate <= date && leaveEntry.endDate >= date;
}

export function computeExpectedWorkdaySummary({
  schedule,
  startDate,
  endDate,
  holidayDates,
  leaveEntries,
}: {
  schedule: StaffScheduleSummary | null;
  startDate: string;
  endDate: string;
  holidayDates: Iterable<string>;
  leaveEntries: Array<Pick<StaffLeaveEntrySummary, "startDate" | "endDate">>;
}) {
  const holidayDateSet = new Set(holidayDates);

  if (!schedule) {
    return {
      scheduledWorkdayCount: 0,
      holidayDayCount: 0,
      approvedLeaveDayCount: 0,
      expectedWorkdayCount: 0,
    };
  }

  let cursor = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  let scheduledWorkdayCount = 0;
  let holidayDayCount = 0;
  let approvedLeaveDayCount = 0;

  while (cursor.isValid && end.isValid && cursor <= end) {
    const cursorDate = cursor.toFormat("yyyy-LL-dd");
    const matchedDay = SCHEDULE_DAY_DEFINITIONS.find((day) => day.luxonWeekday === cursor.weekday);

    if (matchedDay && schedule[matchedDay.key]) {
      scheduledWorkdayCount += 1;

      if (holidayDateSet.has(cursorDate)) {
        holidayDayCount += 1;
      } else if (leaveEntries.some((leaveEntry) => doesLeaveCoverDate(leaveEntry, cursorDate))) {
        approvedLeaveDayCount += 1;
      }
    }

    cursor = cursor.plus({ days: 1 });
  }

  return {
    scheduledWorkdayCount,
    holidayDayCount,
    approvedLeaveDayCount,
    expectedWorkdayCount: Math.max(
      scheduledWorkdayCount - holidayDayCount - approvedLeaveDayCount,
      0,
    ),
  };
}

export function isScheduledWorkdayForDate(
  schedule: StaffScheduleSummary | null,
  date: string,
) {
  if (!schedule) {
    return false;
  }

  const targetDate = DateTime.fromISO(date);

  if (!targetDate.isValid) {
    return false;
  }

  const matchedDay = SCHEDULE_DAY_DEFINITIONS.find((day) => day.luxonWeekday === targetDate.weekday);

  return matchedDay ? schedule[matchedDay.key] : false;
}

export function matchesAttendanceStatusFilter(
  item: AttendanceRosterItem,
  statusFilter: AttendanceFilterStatus | "",
) {
  if (!statusFilter) {
    return true;
  }

  if (statusFilter === "missing_timeout") {
    return item.hasMissingTimeout;
  }

  if (statusFilter === "unrecorded") {
    return item.attendance === null;
  }

  return item.attendance?.status === statusFilter;
}

export function buildAttendanceSummary(items: AttendanceRosterItem[]): AttendanceDailySummary {
  return items.reduce<AttendanceDailySummary>(
    (summary, item) => {
      summary.totalStaff += 1;

      if (item.schedule) {
        summary.scheduleConfiguredCount += 1;
      }

      if (!item.attendance) {
        summary.unrecordedCount += 1;
        return summary;
      }

      summary.recordedCount += 1;

      if (item.isApproved) {
        summary.approvedCount += 1;
      }

      if (item.attendance.status === "present") {
        summary.presentCount += 1;
      }

      if (item.attendance.status === "late") {
        summary.lateCount += 1;
      }

      if (item.attendance.status === "half_day") {
        summary.halfDayCount += 1;
      }

      if (item.attendance.status === "absent") {
        summary.absentCount += 1;
      }

      if (item.hasMissingTimeout) {
        summary.missingTimeoutCount += 1;
      }

      return summary;
    },
    {
      totalStaff: 0,
      recordedCount: 0,
      unrecordedCount: 0,
      presentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
      absentCount: 0,
      missingTimeoutCount: 0,
      approvedCount: 0,
      scheduleConfiguredCount: 0,
    },
  );
}

export function formatHolidayBannerLabel(holiday: BranchHolidaySummary) {
  return `${holiday.label} · ${formatBranchHolidayKindLabel(holiday.holidayKind)}`;
}

function isIsoDate(value: string | undefined): value is string {
  return value ? /^\d{4}-\d{2}-\d{2}$/.test(value) : false;
}

function isStaffRole(value: string | undefined): value is StaffRole {
  return ATTENDANCE_ROLE_OPTIONS.some((option) => option.value === value);
}

function isAttendanceFilterStatus(value: string | undefined): value is AttendanceFilterStatus {
  return ATTENDANCE_FILTER_OPTIONS.some((option) => option.value === value);
}

function resolveScheduleTimeForDate(timeValue: string, date: DateTime) {
  const parsed =
    DateTime.fromFormat(timeValue, "HH:mm:ss", { zone: date.zone }).isValid
      ? DateTime.fromFormat(timeValue, "HH:mm:ss", { zone: date.zone })
      : DateTime.fromFormat(timeValue, "HH:mm", { zone: date.zone });

  if (!parsed.isValid) {
    return parsed;
  }

  return date.set({
    hour: parsed.hour,
    minute: parsed.minute,
    second: parsed.second,
    millisecond: 0,
  });
}
