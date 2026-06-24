import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BranchHolidayRowActions } from "@/features/attendance/components/branch-holiday-row-actions";
import type { BranchHolidaySummary } from "@/features/attendance/types";

vi.mock("@/features/attendance/actions/timekeeping-actions", () => ({
  deleteBranchHolidayAction: vi.fn(),
}));

vi.mock("@/components/shared/table-row-actions-menu", () => ({
  TableRowActionsMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TableRowActionsMenuButton: ({
    label,
    onSelect,
  }: {
    label: string;
    onSelect: () => void;
  }) => (
    <button type="button" onClick={onSelect}>
      {label}
    </button>
  ),
}));

vi.mock("@/components/shared/confirm-action-dialog", () => ({
  ConfirmActionDialog: ({
    open,
    title,
  }: {
    open?: boolean;
    title: string;
  }) => <div data-testid="delete-holiday-dialog">{title}:{open ? "open" : "closed"}</div>,
}));

vi.mock("@/features/attendance/components/branch-holiday-dialog", () => ({
  BranchHolidayDialog: ({
    open,
    holiday,
  }: {
    open?: boolean;
    holiday?: BranchHolidaySummary | null;
  }) => <div data-testid="branch-holiday-dialog">{holiday?.label}:{open ? "open" : "closed"}</div>,
}));

const holiday: BranchHolidaySummary = {
  id: "holiday-1",
  branchId: "branch-1",
  holidayDate: "2026-01-01",
  label: "New Year's Day",
  holidayKind: "public_holiday",
  payTreatment: "paid_regular_day",
  notes: null,
};

describe("BranchHolidayRowActions", () => {
  it("opens the edit holiday dialog from row action menu state", () => {
    render(<BranchHolidayRowActions holiday={holiday} />);

    expect(screen.getByTestId("branch-holiday-dialog")).toHaveTextContent("New Year's Day:closed");

    fireEvent.click(screen.getByText("Edit New Year's Day"));

    expect(screen.getByTestId("branch-holiday-dialog")).toHaveTextContent("New Year's Day:open");
  });

  it("opens the delete confirmation dialog outside the row action menu", () => {
    render(<BranchHolidayRowActions holiday={holiday} />);

    expect(screen.getByTestId("delete-holiday-dialog")).toHaveTextContent("closed");

    fireEvent.click(screen.getByText("Delete calendar date"));

    expect(screen.getByTestId("delete-holiday-dialog")).toHaveTextContent("Delete New Year's Day?:open");
  });
});
