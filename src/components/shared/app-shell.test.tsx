import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/components/shared/branch-scope-selector", () => ({
  BranchScopeSelector: () => <div>Branch scope selector</div>,
}));

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("collapses the desktop sidebar into an icon-only rail from the bottom chevron", () => {
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
        branchScope={{
          canAccessAllBranches: false,
          accessibleBranches: [],
          selectedBranchId: "branch-main",
          selectedBranchLabel: "Main Branch",
        }}
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText("Customers")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(screen.queryByText("Customers")).not.toBeInTheDocument();
  });

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
        branchScope={{
          canAccessAllBranches: false,
          accessibleBranches: [],
          selectedBranchId: "branch-main",
          selectedBranchLabel: "Main Branch",
        }}
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.queryByRole("button", { name: "Close navigation menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Toggle sidebar" })[0]);

    expect(screen.getByRole("link", { name: /Quick Access/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Customers" }).length).toBeGreaterThan(0);
  });

  it("can show the business name block in the sidebar when enabled", () => {
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
        ]}
        userDisplayName="Alex"
        userRoleLabel="Administrator"
        capabilities={[]}
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
        branchScope={{
          canAccessAllBranches: false,
          accessibleBranches: [],
          selectedBranchId: "branch-main",
          selectedBranchLabel: "Main Branch",
        }}
        showSidebarBusinessName
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Toggle sidebar" })[0]);

    expect(screen.getAllByText("SAY Auto Care Center").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Workshop administration").length).toBeGreaterThan(0);
  });
});
