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
    expect(screen.getAllByRole("link", { name: "Catalog" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Service Quote" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
  });

  it("marks the service quote action as current when on the quote page", () => {
    pathname = "/get-quote";

    render(
      <PublicSiteShell shellData={shellData}>
        <div>Quote page content</div>
      </PublicSiteShell>,
    );

    expect(screen.getAllByRole("link", { name: "Service Quote" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
