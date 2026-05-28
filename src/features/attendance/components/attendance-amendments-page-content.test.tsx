import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AttendanceAmendmentsPageContent } from "@/features/attendance/components/attendance-amendments-page-content";
import type { AttendanceAmendmentsPageData } from "@/features/attendance/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/attendance/amendments",
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/features/attendance/actions/mechanic-portal-actions", () => ({
  reviewDtrAmendmentAction: vi.fn(),
}));

const amendmentsData: AttendanceAmendmentsPageData = {
  pendingCount: 1,
  totalCount: 1,
  amendments: [
    {
      id: "amendment-1",
      branchId: "branch-1",
      staffId: "staff-1",
      staffName: "Jerick B. Tayona",
      staffRole: "mechanic",
      attendanceId: "attendance-1",
      attendanceDate: "2026-05-25",
      targetLogType: "time_out",
      amendmentType: "missed_time_out",
      requestedTimestamp: "2026-05-25T06:05:00.000Z",
      reason: "Forgot to time out after closing the bay.",
      proofUrl: null,
      status: "pending",
      requestedIp: "124.217.22.199",
      requestUserAgent: "Chrome on Mac",
      approvedTimestamp: null,
      approvedByStaffId: null,
      approvedByName: null,
      rejectedAt: null,
      rejectedByStaffId: null,
      rejectedByName: null,
      finalTimestamp: null,
      adminNote: null,
      createdAt: "2026-05-25T06:10:00.000Z",
      updatedAt: "2026-05-25T06:10:00.000Z",
    },
  ],
};

describe("AttendanceAmendmentsPageContent", () => {
  it("opens the review dialog from the row actions menu", async () => {
    const user = userEvent.setup();

    render(<AttendanceAmendmentsPageContent data={amendmentsData} />);

    await user.click(
      screen.getByRole("button", { name: "Amendment actions for Jerick B. Tayona" }),
    );

    const reviewAction = await screen.findByText("Review amendment");
    await user.click(reviewAction);

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Review DTR amendment" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Approve amendment" })).toBeInTheDocument();
  });
});
