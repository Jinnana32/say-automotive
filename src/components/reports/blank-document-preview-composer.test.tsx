import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlankDocumentPreviewComposer } from "@/components/reports/blank-document-preview-composer";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BlankDocumentPreviewComposer", () => {
  it("updates the live preview from the title and body editors", () => {
    const { container } = render(
      <BlankDocumentPreviewComposer
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
        businessVatRegistrationNo="123-456-789-000"
        businessContact="09171234567"
        businessEmail="hello@sayautocare.com"
        businessAddress="Quezon City"
        branchName="Main Branch"
      />,
    );

    const titleInput = screen.getByLabelText("Document Title");
    const bodyTextarea = screen.getByLabelText("Body Content");

    fireEvent.change(titleInput, { target: { value: "Customer Notice" } });
    fireEvent.change(bodyTextarea, {
      target: { value: "Line one\nLine two" },
    });

    expect(
      screen.getByRole("heading", { name: "Customer Notice" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".whitespace-pre-wrap")?.textContent).toContain("Line one");
    expect(container.querySelector(".whitespace-pre-wrap")?.textContent).toContain("Line two");
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
  });
});
