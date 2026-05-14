"use client";

import { useState } from "react";
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

export function AppShell({
  children,
  navigationItems,
  userDisplayName,
  userRoleLabel,
  capabilities,
  businessName,
  businessLogoUrl,
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
  showSidebarBusinessName?: boolean;
}>) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const activeItem = resolveActiveNavigationItem(navigationItems, pathname);
  void capabilities;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        navigationItems={navigationItems}
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
        showBusinessName={showSidebarBusinessName}
        className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:w-[15.5rem] xl:flex-col"
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
          className="fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[calc(100vw-2rem)] flex-col shadow-2xl xl:hidden"
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
          showCloseButton
        />
      ) : null}
      <div className="min-h-screen xl:pl-[15.5rem]">
        <AppTopbar
          activeLabel={activeItem?.label ?? "Dashboard"}
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
          onOpenNavigation={() => setIsMobileSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
