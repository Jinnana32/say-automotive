"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { PageContainer } from "@/components/shared/page-container";
import type { AppCapability } from "@/lib/auth/permissions";
import {
  resolveActiveNavigationItem,
  type NavigationGroup,
  type NavigationIconName,
} from "@/lib/navigation";

const SIDEBAR_COLLAPSE_STORAGE_KEY = "say-admin-sidebar-collapsed";
const DESKTOP_SIDEBAR_EXPANDED_CLASS = "xl:w-[15.5rem]";
const DESKTOP_SIDEBAR_COLLAPSED_CLASS = "xl:w-[5.75rem]";
const DESKTOP_CONTENT_EXPANDED_CLASS = "xl:pl-[15.5rem]";
const DESKTOP_CONTENT_COLLAPSED_CLASS = "xl:pl-[5.75rem]";

export function AppShell({
  children,
  navigationItems,
  userDisplayName,
  userRoleLabel,
  capabilities,
  businessName,
  businessLogoUrl,
  branchScope,
  showSidebarBusinessName = false,
}: Readonly<{
  children: React.ReactNode;
  navigationItems: ReadonlyArray<{
    href: string;
    label: string;
    description: string;
    group: NavigationGroup;
    iconName: NavigationIconName;
    showInSidebar?: boolean;
    showAsMobileShortcut?: boolean;
  }>;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
  businessName: string;
  businessLogoUrl: string | null;
  branchScope: {
    canAccessAllBranches: boolean;
    accessibleBranches: Array<{
      id: string;
      code: string;
      name: string;
    }>;
    selectedBranchId: string | null;
    selectedBranchLabel: string;
  };
  showSidebarBusinessName?: boolean;
}>) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const activeItem = resolveActiveNavigationItem(navigationItems, pathname);
  void capabilities;

  useEffect(() => {
    try {
      setIsDesktopSidebarCollapsed(
        window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true",
      );
    } catch {
      setIsDesktopSidebarCollapsed(false);
    }
  }, []);

  function handleToggleDesktopSidebar() {
    setIsDesktopSidebarCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(
          SIDEBAR_COLLAPSE_STORAGE_KEY,
          String(next),
        );
      } catch {
        // Ignore storage failures and keep the UI responsive.
      }

      return next;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        navigationItems={navigationItems}
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
        showBusinessName={showSidebarBusinessName}
        collapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={handleToggleDesktopSidebar}
        showCollapseButton
        className={`no-print hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:flex-col ${isDesktopSidebarCollapsed ? DESKTOP_SIDEBAR_COLLAPSED_CLASS : DESKTOP_SIDEBAR_EXPANDED_CLASS}`}
      />
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/35"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Dismiss navigation overlay"
          />
        </div>
      ) : null}
      {isMobileSidebarOpen ? (
        <AppSidebar
          navigationItems={navigationItems}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          showBusinessName={showSidebarBusinessName}
          className="no-print fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[calc(100vw-2rem)] flex-col shadow-2xl xl:hidden"
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
          showCloseButton
        />
      ) : null}
      <div
        className={`min-h-screen ${isDesktopSidebarCollapsed ? DESKTOP_CONTENT_COLLAPSED_CLASS : DESKTOP_CONTENT_EXPANDED_CLASS}`}
      >
        <div className="no-print">
          <AppTopbar
            activeLabel={activeItem?.label ?? "Dashboard"}
            userDisplayName={userDisplayName}
            userRoleLabel={userRoleLabel}
            branchScope={branchScope}
            onOpenNavigation={() => setIsMobileSidebarOpen(true)}
          />
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
