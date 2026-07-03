import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicSiteShell } from "@/features/website/components/public-site-shell";
import type { WebsiteShellData } from "@/features/website/types";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const shellData: WebsiteShellData = {
  businessName: "SAY Auto Care Center",
  businessLogoUrl: null,
  branchName: "Main Branch",
  address: "123 Service Road",
  contactNumber: "09171234567",
  email: "say@example.com",
};

describe("PublicSiteShell", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("opens and closes the mobile navigation menu from the hamburger button", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Services" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Catalog" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Brands" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
  });

  it("uses the official full logo fallback consistently in the public header", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    const logos = screen.getAllByAltText("SAY Auto Care Center");

    expect(logos[0]).toHaveAttribute("src", expect.stringContaining("/brand/website-official-logo-transparent.png"));
    expect(screen.queryByAltText("SAY Auto Care Center shield")).not.toBeInTheDocument();
  });

  it("shows the updated store hours in the public footer", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.getByText("Store Hours")).toBeInTheDocument();
    expect(screen.getByText("Monday – Saturday")).toBeInTheDocument();
    expect(screen.getByText("7:00 AM – 5:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("renders the footer address link with the expected Google Maps URL", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps/place/SAY+Auto+Care+Center+%2F+Mags+%26+Tires/@10.7204706,122.5314177,17z/data=!3m1!4b1!4m6!3m5!1s0x33aefb11f1e70e4f:0x551d5bca1b30e393!8m2!3d10.7204653!4d122.5339926!16s%2Fg%2F11y2dx8r3_",
    );
    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the footer Facebook link with the expected external URL", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.getByRole("link", { name: "Visit SAY Auto Care on Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/SayAutomotive1",
    );
    expect(screen.getByRole("link", { name: "Visit SAY Auto Care on Facebook" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Visit SAY Auto Care on Facebook" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
