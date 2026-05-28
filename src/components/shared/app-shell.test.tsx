import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/app-shell";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    routerPush.mockReset();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
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
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText("Customers")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(screen.queryByText("Customers")).not.toBeInTheDocument();
    expect(screen.getByAltText("SAY Auto Care Center mark")).toBeInTheDocument();
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

  it("defaults to a collapsed sidebar on tablet widths but still allows expanding", async () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px) and (max-width: 1023px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

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
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Customers")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
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
        showSidebarBusinessName
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Toggle sidebar" })[0]);

    expect(screen.getAllByText("SAY Auto Care Center").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Workshop administration").length).toBeGreaterThan(0);
  });

  it("shows a create menu in the topbar for quotation, customer, and vehicle shortcuts", async () => {
    const user = userEvent.setup();

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
        capabilities={["quotations:write", "customers:write", "vehicles:write"]}
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    await user.click(screen.getAllByRole("button", { name: "Create new" })[0]);

    expect(await screen.findByText("New quotation")).toBeInTheDocument();
    expect(screen.getByText("New customer")).toBeInTheDocument();
    expect(screen.getByText("New vehicle")).toBeInTheDocument();

    await user.click(screen.getByText("New quotation"));

    expect(routerPush).toHaveBeenCalledWith("/quotations/new");
  });
});
