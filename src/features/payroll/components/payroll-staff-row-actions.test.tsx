import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PayrollStaffRowActions } from "@/features/payroll/components/payroll-staff-row-actions";

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

vi.mock("@/features/attendance/components/staff-schedule-dialog", () => ({
  StaffScheduleDialog: ({
    open,
    staffName,
  }: {
    open?: boolean;
    staffName: string;
  }) => <div data-testid="schedule-dialog">{staffName}:{open ? "open" : "closed"}</div>,
}));

vi.mock("@/features/payroll/components/compensation-profile-dialog", () => ({
  CompensationProfileDialog: ({
    open,
    staffName,
  }: {
    open?: boolean;
    staffName: string;
  }) => <div data-testid="compensation-dialog">{staffName}:{open ? "open" : "closed"}</div>,
}));

describe("PayrollStaffRowActions", () => {
  it("opens the schedule and compensation dialogs from row action menu state", () => {
    render(
      <PayrollStaffRowActions
        staffId="staff-1"
        staffName="Jane Doe"
        schedule={null}
        profile={null}
      />,
    );

    expect(screen.getByTestId("schedule-dialog")).toHaveTextContent("Jane Doe:closed");
    expect(screen.getByTestId("compensation-dialog")).toHaveTextContent("Jane Doe:closed");

    fireEvent.click(screen.getByText("Edit schedule"));

    expect(screen.getByTestId("schedule-dialog")).toHaveTextContent("Jane Doe:open");

    fireEvent.click(screen.getByText("Edit compensation"));

    expect(screen.getByTestId("compensation-dialog")).toHaveTextContent("Jane Doe:open");
  });
});
