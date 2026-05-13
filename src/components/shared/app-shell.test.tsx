import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AppShell", () => {
  it("opens mobile navigation from the topbar menu button", () => {
    render(
      <AppShell
        navigationItems={[
          {
            href: "/dashboard",
            label: "Dashboard",
            description: "Overview of shop activity",
            group: "Overview",
            iconName: "dashboard",
          },
          {
            href: "/quick-access",
            label: "Quick Access",
            description: "Fast lookup for returning customers and vehicles.",
            group: "Overview",
            iconName: "quick-access",
            showInSidebar: false,
            showAsMobileShortcut: true,
          },
          {
            href: "/customers",
            label: "Customers",
            description: "Manage customer records",
            group: "Service Desk",
            iconName: "customers",
          },
        ]}
        userDisplayName="Alex"
        userRoleLabel="Administrator"
        capabilities={[]}
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.queryByRole("button", { name: "Close navigation menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

    expect(screen.getByRole("link", { name: /Quick Access/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Customers" }).length).toBeGreaterThan(0);
  });
});
