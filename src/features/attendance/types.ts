import type { StaffRole } from "@/lib/auth/permissions";
import type { Database } from "@/types/database";

export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type AttendanceFilterStatus = AttendanceStatus | "missing_timeout" | "unrecorded";
export type BranchHolidayKind = "regular" | "special" | "branch_closure" | "other";
export type StaffLeaveType = "vacation" | "sick" | "emergency" | "unpaid" | "other";
export type AttendanceLogType = "time_in" | "time_out";
export type AttendanceLogSource =
  | "mechanic_portal"
  | "admin_approved_amendment"
  | "admin_override";
export type StaffDeviceStatus = "pending" | "approved" | "revoked";
export type DtrAmendmentType =
  | "missed_time_in"
  | "missed_time_out"
  | "wrong_time"
  | "shop_network_issue"
  | "other";
export type DtrAmendmentStatus = "pending" | "approved" | "rejected";

export type AttendanceAccessSettings = {
  requireShopIpForMechanicAttendance: boolean;
  allowDtrAmendments: boolean;
  allowAttendanceAdminOverride: boolean;
};

export type AttendanceAllowedIpSummary = {
  id: string;
  branchId: string;
  ipAddress: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceTimeLogSummary = {
  id: string;
  staffId: string;
  attendanceId: string | null;
  amendmentId: string | null;
  staffDeviceId: string | null;
  attendanceDate: string;
  logType: AttendanceLogType;
  loggedAt: string;
  source: AttendanceLogSource;
  requestIp: string | null;
  isShopIpValid: boolean;
  isDeviceApproved: boolean;
  userAgent: string | null;
  createdAt: string;
};

export type StaffDeviceSummary = {
  id: string;
  staffId: string;
  deviceName: string | null;
  userAgent: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastIp: string | null;
  status: StaffDeviceStatus;
  approvedAt: string | null;
  approvedByStaffId: string | null;
  revokedAt: string | null;
  revokedByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DtrAmendmentSummary = {
  id: string;
  branchId: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  attendanceId: string | null;
  attendanceDate: string;
  targetLogType: AttendanceLogType;
  amendmentType: DtrAmendmentType;
  requestedTimestamp: string;
  reason: string;
  proofUrl: string | null;
  status: DtrAmendmentStatus;
  requestedIp: string | null;
  requestUserAgent: string | null;
  approvedTimestamp: string | null;
  approvedByStaffId: string | null;
  approvedByName: string | null;
  rejectedAt: string | null;
  rejectedByStaffId: string | null;
  rejectedByName: string | null;
  finalTimestamp: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MechanicPortalIpStatus = {
  requestIp: string | null;
  isShopIpRequired: boolean;
  isAllowed: boolean;
  matchedAllowedIp: AttendanceAllowedIpSummary | null;
};

export type MechanicPortalDeviceStatus = {
  status: "missing" | "pending" | "approved" | "revoked" | "registered_to_other_staff";
  hasDeviceToken: boolean;
  isApproved: boolean;
  currentDevice: StaffDeviceSummary | null;
};

export type BranchHolidaySummary = {
  id: string;
  branchId: string;
  holidayDate: string;
  label: string;
  holidayKind: BranchHolidayKind;
  notes: string | null;
};

export type StaffLeaveEntrySummary = {
  id: string;
  branchId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: StaffLeaveType;
  notes: string | null;
};

export type StaffScheduleSummary = {
  id: string;
  staffId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  graceMinutes: number;
  mondayIsWorkday: boolean;
  tuesdayIsWorkday: boolean;
  wednesdayIsWorkday: boolean;
  thursdayIsWorkday: boolean;
  fridayIsWorkday: boolean;
  saturdayIsWorkday: boolean;
  sundayIsWorkday: boolean;
  notes: string | null;
};

export type AttendanceDateLockSummary = {
  payrollPeriodId: string;
  payrollPeriodLabel: string;
  payrollPeriodStatus: Database["public"]["Enums"]["payroll_period_status"];
};

export type AttendancePageFilters = {
  date: string;
  search: string;
  role: StaffRole | "";
  status: AttendanceFilterStatus | "";
};

export type AttendanceRecordSummary = {
  id: string;
  attendanceDate: string;
  timeIn: string | null;
  timeOut: string | null;
  status: AttendanceStatus;
  notes: string | null;
  approvedByStaffId: string | null;
  approvedAt: string | null;
};

export type AttendanceRosterItem = {
  staffId: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  schedule: StaffScheduleSummary | null;
  leaveEntry: StaffLeaveEntrySummary | null;
  attendance: AttendanceRecordSummary | null;
  hasMissingTimeout: boolean;
  isApproved: boolean;
};

export type AttendanceDailySummary = {
  totalStaff: number;
  recordedCount: number;
  unrecordedCount: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  missingTimeoutCount: number;
  approvedCount: number;
  scheduleConfiguredCount: number;
};

export type AttendanceRosterData = {
  filters: AttendancePageFilters;
  branchHoliday: BranchHolidaySummary | null;
  summary: AttendanceDailySummary;
  roster: AttendanceRosterItem[];
  totalMatchingStaff: number;
  visibleCount: number;
  lockedPeriod: AttendanceDateLockSummary | null;
};

export type AttendanceCalendarStatus = "complete" | "attention" | "absent" | "none";

export type AttendanceCalendarDaySummary = {
  date: string;
  status: AttendanceCalendarStatus;
  staffCount: number;
  recordedCount: number;
  approvedCount: number;
  attentionCount: number;
  absentCount: number;
};

export type AttendanceCalendarMonthData = {
  month: string;
  monthLabel: string;
  monthStartDate: string;
  monthEndDate: string;
  selectedDate: string;
  days: AttendanceCalendarDaySummary[];
};

export type AttendanceFormValues = {
  staffId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  timeIn: string;
  timeOut: string;
  notes: string;
};

export type StaffScheduleFormValues = {
  staffId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  graceMinutes: string;
  mondayIsWorkday: boolean;
  tuesdayIsWorkday: boolean;
  wednesdayIsWorkday: boolean;
  thursdayIsWorkday: boolean;
  fridayIsWorkday: boolean;
  saturdayIsWorkday: boolean;
  sundayIsWorkday: boolean;
  notes: string;
};

export type BranchHolidayFormValues = {
  holidayId: string;
  holidayDate: string;
  label: string;
  holidayKind: BranchHolidayKind;
  notes: string;
};

export type StaffLeaveFormValues = {
  leaveEntryId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: StaffLeaveType;
  notes: string;
};

export type TimekeepingCalendarStaffOption = {
  id: string;
  fullName: string;
  role: StaffRole;
  status: Database["public"]["Enums"]["record_status"];
};

export type StaffLeaveManagementItem = StaffLeaveEntrySummary & {
  staffName: string;
  staffRole: StaffRole | null;
};

export type TimekeepingCalendarPageData = {
  branchName: string;
  attendanceAccessSettings: AttendanceAccessSettings;
  allowedIpAddresses: AttendanceAllowedIpSummary[];
  currentDetectedIp: string | null;
  observedRequestIp: string | null;
  pendingAmendmentCount: number;
  pendingDeviceCount: number;
  holidays: BranchHolidaySummary[];
  devicesReview: AttendanceDevicesPageData;
};

export type ApprovedLeaveManagementData = {
  activeStaff: TimekeepingCalendarStaffOption[];
  leaveEntries: StaffLeaveManagementItem[];
};

export type AttendancePageData = {
  rosterData: AttendanceRosterData;
  attendanceData: AttendanceRosterData;
  attendanceCalendar: AttendanceCalendarMonthData;
  amendmentsReview: AttendanceAmendmentsPageData;
  leaveManagement: ApprovedLeaveManagementData;
};

export type AttendanceEntryActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type TimekeepingActionState = AttendanceEntryActionState;

export type AttendanceAccessSettingsFormValues = AttendanceAccessSettings;

export type AttendanceAllowedIpFormValues = {
  ipAddress: string;
  label: string;
};

export type DtrAmendmentFormValues = {
  attendanceDate: string;
  targetLogType: AttendanceLogType;
  amendmentType: DtrAmendmentType;
  requestedTime: string;
  reason: string;
};

export type DtrAmendmentReviewFormValues = {
  amendmentId: string;
  decision: "approved" | "rejected";
  finalTime: string;
  adminNote: string;
};

export type MechanicPortalAttendancePageData = {
  staffId: string;
  displayName: string;
  todayDate: string;
  settings: AttendanceAccessSettings;
  ipStatus: MechanicPortalIpStatus;
  deviceStatus: MechanicPortalDeviceStatus;
  attendance: AttendanceRecordSummary | null;
  todayAmendments: DtrAmendmentSummary[];
  recentAmendments: DtrAmendmentSummary[];
};

export type MechanicPortalAmendmentsPageData = {
  displayName: string;
  todayDate: string;
  settings: AttendanceAccessSettings;
  deviceStatus: MechanicPortalDeviceStatus;
  amendments: DtrAmendmentSummary[];
};

export type MechanicPortalHistoryCalendarStatus =
  | "present"
  | "incomplete"
  | "absent"
  | "none";

export type MechanicPortalHistoryDay = {
  date: string;
  attendance: AttendanceRecordSummary | null;
  amendments: DtrAmendmentSummary[];
  timeLogs: AttendanceTimeLogSummary[];
  isFuture: boolean;
  isScheduledWorkday: boolean;
  isBranchHoliday: boolean;
  leaveEntry: StaffLeaveEntrySummary | null;
  calendarStatus: MechanicPortalHistoryCalendarStatus;
};

export type MechanicPortalHistoryPageData = {
  displayName: string;
  todayDate: string;
  month: string;
  monthLabel: string;
  monthStartDate: string;
  monthEndDate: string;
  initialSelectedDate: string;
  settings: AttendanceAccessSettings;
  schedule: StaffScheduleSummary | null;
  branchHolidays: BranchHolidaySummary[];
  days: MechanicPortalHistoryDay[];
  recentAmendments: DtrAmendmentSummary[];
};

export type AttendanceAmendmentsPageData = {
  pendingCount: number;
  totalCount: number;
  amendments: DtrAmendmentSummary[];
};

export type AttendanceStaffDeviceManagementItem = StaffDeviceSummary & {
  staffName: string;
  staffRole: StaffRole;
};

export type AttendanceDevicesPageData = {
  pendingCount: number;
  approvedCount: number;
  revokedCount: number;
  devices: AttendanceStaffDeviceManagementItem[];
};
