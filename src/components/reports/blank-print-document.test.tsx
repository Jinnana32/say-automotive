import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlankPrintDocument } from "@/components/reports/blank-print-document";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BlankPrintDocument", () => {
  it("renders header, body, and footer inside the shared print scaffold", () => {
    const { container } = render(
      <BlankPrintDocument
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
        businessVatRegistrationNo="123-456-789-000"
        businessContact="09171234567"
        businessEmail="hello@sayautocare.com"
        businessAddress="Quezon City"
        documentTitle="Quotation"
        documentMeta="Quotation No.: QT-MAIN-0001"
      >
        <div>Printable body content</div>
      </BlankPrintDocument>,
    );

    expect(container.querySelector(".print-page")).not.toBeNull();
    expect(container.querySelector(".print-document-frame")).not.toBeNull();
    expect(container.querySelector(".print-document-header")).not.toBeNull();
    expect(container.querySelector(".print-document-body")).not.toBeNull();
    expect(container.querySelector(".print-document-footer")).not.toBeNull();

    expect(screen.getByText("Printable body content")).toBeInTheDocument();
    expect(screen.getByText("VAT Reg. No.: 244-205-707")).toBeInTheDocument();
    expect(screen.getByText("SAY Auto Care Center / Mags & Tires")).toBeInTheDocument();
  });
});
