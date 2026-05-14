import { DateTime } from "luxon";

import { AttendancePageContent } from "@/features/attendance/components/attendance-page-content";
import { getAttendanceAmendmentsPageData } from "@/features/attendance/queries/attendance-amendment-queries";
import {
  getAttendanceCalendarMonthData,
  getAttendanceRosterData,
} from "@/features/attendance/queries/attendance-queries";
import { getApprovedLeaveManagementData } from "@/features/attendance/queries/approved-leave-management-queries";
import { resolveAttendancePageFilters } from "@/features/attendance/utils";

export const dynamic = "force-dynamic";

type AttendancePageProps = {
  searchParams: Promise<{
    date?: string;
    month?: string;
    tab?: string;
    rosterSearch?: string;
    rosterRole?: string;
    attendanceSearch?: string;
    attendanceStatus?: string;
    leaveSearch?: string;
    leaveType?: string;
    amendmentSearch?: string;
    amendmentStatus?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const resolvedParams = await searchParams;
  const defaultDate = resolveAttendancePageFilters({
    date: resolvedParams.date,
    search: "",
    role: "",
    status: "",
  }).date;
  const alignedDate = alignAttendanceDateToMonth(defaultDate, resolvedParams.month);
  const rosterFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: resolvedParams.rosterSearch,
    role: resolvedParams.rosterRole,
    status: "",
  });
  const attendanceFilters = resolveAttendancePageFilters({
    date: alignedDate,
    search: resolvedParams.attendanceSearch,
    role: "",
    status: resolvedParams.attendanceStatus,
  });
  const [rosterData, attendanceData, attendanceCalendar, amendmentsReview, leaveManagement] = await Promise.all([
    getAttendanceRosterData(rosterFilters),
    getAttendanceRosterData(attendanceFilters, {
      excludeRoles: ["admin", "owner"],
    }),
    getAttendanceCalendarMonthData({
      selectedDate: attendanceFilters.date,
      requestedMonth: resolvedParams.month,
    }),
    getAttendanceAmendmentsPageData(),
    getApprovedLeaveManagementData(),
  ]);

  return (
    <AttendancePageContent
      data={{ rosterData, attendanceData, attendanceCalendar, amendmentsReview, leaveManagement }}
    />
  );
}

function alignAttendanceDateToMonth(date: string, requestedMonth?: string) {
  const resolvedDate = DateTime.fromISO(date);
  const requestedMonthValue = requestedMonth
    ? DateTime.fromFormat(requestedMonth, "yyyy-LL")
    : null;

  if (
    resolvedDate.isValid &&
    requestedMonthValue?.isValid &&
    !resolvedDate.hasSame(requestedMonthValue, "month")
  ) {
    return requestedMonthValue.startOf("month").toFormat("yyyy-LL-dd");
  }

  return resolvedDate.isValid
    ? resolvedDate.toFormat("yyyy-LL-dd")
    : DateTime.now().toFormat("yyyy-LL-dd");
}
