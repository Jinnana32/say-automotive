import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";

describe("ConfirmActionDialog", () => {
  it("opens the dialog from the trigger", () => {
    render(
      <ConfirmActionDialog
        title="Delete vehicle?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        action={vi.fn()}
        trigger={({ openDialog }) => (
          <Button type="button" onClick={openDialog}>
            Open
          </Button>
        )}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog", { name: "Delete vehicle?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
