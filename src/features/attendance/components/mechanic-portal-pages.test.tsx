import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OFFICIAL_BRAND_MARK_SRC } from "@/components/shared/brand-assets";
import { MechanicPortalAttendancePage } from "@/features/attendance/components/mechanic-portal-attendance-page";
import { MechanicPortalHeaderCard } from "@/features/attendance/components/mechanic-portal-header-card";
import { MechanicPortalHistoryPage } from "@/features/attendance/components/mechanic-portal-history-page";
import type {
  MechanicPortalAttendancePageData,
  MechanicPortalHistoryPageData,
} from "@/features/attendance/types";

const routerPush = vi.fn();
let pathname = "/portal/history";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    refresh: vi.fn(),
  }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/features/attendance/actions/mechanic-portal-actions", () => ({
  recordMechanicAttendanceLogAction: vi.fn(),
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/features/attendance/components/dtr-amendment-form", () => ({
  DtrAmendmentForm: () => <div>DTR amendment form</div>,
}));

const attendanceData: MechanicPortalAttendancePageData = {
  staffId: "staff-1",
  displayName: "Jerick B. Tayona",
  todayDate: "2026-05-14",
  settings: {
    requireShopIpForMechanicAttendance: true,
    allowDtrAmendments: true,
    allowAttendanceAdminOverride: false,
  },
  ipStatus: {
    requestIp: "124.217.16.204",
    isShopIpRequired: true,
    isAllowed: true,
    matchedAllowedIp: {
      id: "ip-1",
      branchId: "branch-1",
      ipAddress: "124.217.16.204",
      label: "Main Wi-Fi",
      createdAt: "2026-05-14T01:00:00.000Z",
      updatedAt: "2026-05-14T01:00:00.000Z",
    },
  },
  deviceStatus: {
    status: "approved",
    hasDeviceToken: true,
    isApproved: true,
    currentDevice: {
      id: "device-1",
      staffId: "staff-1",
      deviceName: "Safari on iPhone",
      userAgent: "Safari on iPhone",
      firstSeenAt: "2026-05-14T01:00:00.000Z",
      lastSeenAt: "2026-05-14T01:00:00.000Z",
      lastIp: "124.217.16.204",
      status: "approved",
      approvedAt: "2026-05-14T01:00:00.000Z",
      approvedByStaffId: "owner-1",
      revokedAt: null,
      revokedByStaffId: null,
      createdAt: "2026-05-14T01:00:00.000Z",
      updatedAt: "2026-05-14T01:00:00.000Z",
    },
  },
  attendance: {
    id: "attendance-1",
    attendanceDate: "2026-05-14",
    timeIn: "2026-05-14T01:35:00.000Z",
    timeOut: null,
    status: "present",
    notes: null,
    approvedByStaffId: null,
    approvedAt: null,
  },
  todayAmendments: [],
  recentAmendments: [],
};

const historyData: MechanicPortalHistoryPageData = {
  displayName: "Jerick B. Tayona",
  todayDate: "2026-05-14",
  month: "2026-05",
  monthLabel: "May 2026",
  monthStartDate: "2026-05-01",
  monthEndDate: "2026-05-31",
  initialSelectedDate: "2026-05-14",
  settings: {
    requireShopIpForMechanicAttendance: true,
    allowDtrAmendments: true,
    allowAttendanceAdminOverride: false,
  },
  schedule: null,
  branchHolidays: [],
  days: [
    {
      date: "2026-05-14",
      attendance: {
        id: "attendance-1",
        attendanceDate: "2026-05-14",
        timeIn: "2026-05-14T01:35:00.000Z",
        timeOut: "2026-05-14T09:18:00.000Z",
        status: "present",
        notes: null,
        approvedByStaffId: null,
        approvedAt: null,
      },
      amendments: [],
      timeLogs: [
        {
          id: "log-1",
          staffId: "staff-1",
          attendanceId: "attendance-1",
          amendmentId: null,
          staffDeviceId: "device-1",
          attendanceDate: "2026-05-14",
          logType: "time_in",
          loggedAt: "2026-05-14T01:35:00.000Z",
          source: "mechanic_portal",
          requestIp: "124.217.16.204",
          isShopIpValid: true,
          isDeviceApproved: true,
          userAgent: "Safari on iPhone",
          createdAt: "2026-05-14T01:35:00.000Z",
        },
      ],
      isFuture: false,
      isScheduledWorkday: true,
      isBranchHoliday: false,
      leaveEntry: null,
      calendarStatus: "present",
    },
    {
      date: "2026-05-15",
      attendance: null,
      amendments: [],
      timeLogs: [],
      isFuture: false,
      isScheduledWorkday: true,
      isBranchHoliday: false,
      leaveEntry: null,
      calendarStatus: "absent",
    },
  ],
  recentAmendments: [],
};

describe("mechanic portal pages", () => {
  it("renders the new home attendance sections and correction wording", () => {
    pathname = "/portal/attendance";
    render(<MechanicPortalAttendancePage data={attendanceData} />);

    expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    expect(screen.getByText("Timed In")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Time Out" })).toBeInTheDocument();
    expect(screen.getByText("Verification Status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request Time Correction" })).toBeInTheDocument();
    expect(screen.getByText("Recent Requests")).toBeInTheDocument();
    expect(screen.getByText("No correction requests yet.")).toBeInTheDocument();
  });

  it("renders the history page with the calendar details and correction action", () => {
    pathname = "/portal/history";
    render(<MechanicPortalHistoryPage data={historyData} />);

    expect(screen.getByText("Attendance Calendar")).toBeInTheDocument();
    expect(screen.getByText("Recent Amendments")).toBeInTheDocument();
    expect(screen.getByText("No correction requests yet.")).toBeInTheDocument();
    expect(screen.getByText("May 2026")).toBeInTheDocument();
  });

  it("renders the shared mechanic identity header", () => {
    pathname = "/portal/history";
    render(<MechanicPortalHeaderCard displayName="Jerick B. Tayona" />);

    expect(screen.getByLabelText("Mechanic identity")).toBeInTheDocument();
    expect(screen.queryByLabelText("Portal branding")).not.toBeInTheDocument();
    expect(screen.getByText("Jerick B. Tayona")).toBeInTheDocument();
    expect(screen.getByText("Mechanic • SAY Auto Care Center")).toBeInTheDocument();
    expect(screen.getByAltText("SAY Auto Care Center shield")).toHaveAttribute(
      "src",
      OFFICIAL_BRAND_MARK_SRC,
    );
  });
});
