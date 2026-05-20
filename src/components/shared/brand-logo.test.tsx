import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BrandLogo } from "@/components/shared/brand-logo";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BrandLogo", () => {
  it("renders the provided business logo when a src is available", () => {
    render(
      <BrandLogo
        src="https://example.com/latest-logo.png"
        alt="SAY Auto Care Center"
        width={220}
        height={64}
      />,
    );

    expect(screen.getByAltText("SAY Auto Care Center")).toHaveAttribute(
      "src",
      "https://example.com/latest-logo.png",
    );
  });

  it("renders the provided brand mark when the mark variant is requested", () => {
    render(
      <BrandLogo
        markSrc="/say-auto-care-shield.png"
        alt="SAY Auto Care Center mark"
        variant="mark"
        width={52}
        height={52}
      />,
    );

    expect(screen.getByAltText("SAY Auto Care Center mark")).toHaveAttribute(
      "src",
      "/say-auto-care-shield.png",
    );
  });

  it("renders the shared wordmark fallback when no logo src is available", () => {
    render(
      <BrandLogo
        src={null}
        alt="SAY Auto Care Center"
        width={220}
        height={64}
      />,
    );

    expect(screen.getByRole("img", { name: "SAY Auto Care Center" })).toBeInTheDocument();
    expect(screen.getByText("SAY")).toBeInTheDocument();
    expect(screen.getByText("Auto Care")).toBeInTheDocument();
    expect(screen.getByText("Center")).toBeInTheDocument();
  });
});
