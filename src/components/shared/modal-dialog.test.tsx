import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";

describe("ModalDialog", () => {
  it("opens a scroll-safe dialog shell for tall mobile content", () => {
    const { container } = render(
      <ModalDialog
        title="File DTR amendment"
        description="Use this when you missed a punch."
        trigger={({ openDialog }) => (
          <Button type="button" onClick={openDialog}>
            Open
          </Button>
        )}
      >
        {() => (
          <div>
            <p>Dialog body</p>
          </div>
        )}
      </ModalDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(
      screen.getByRole("dialog", { name: "File DTR amendment" }),
    ).toBeInTheDocument();
    expect(container.ownerDocument.body.querySelector(".overflow-y-auto")).not.toBeNull();
    expect(
      container.ownerDocument.body.querySelector(".max-h-\\[calc\\(100dvh-2rem\\)\\]"),
    ).not.toBeNull();
  });
});
