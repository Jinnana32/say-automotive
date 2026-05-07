"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { PageContainer } from "@/components/shared/page-container";
import type { AppCapability } from "@/lib/auth/permissions";
import type { NavigationGroup, NavigationIconName } from "@/lib/navigation";

export function AppShell({
  children,
  navigationItems,
  userDisplayName,
  userRoleLabel,
  capabilities,
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
}>) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const activeItem =
    navigationItems.find(
      (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
    ) ?? navigationItems[0];

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        navigationItems={navigationItems}
        userDisplayName={userDisplayName}
        userRoleLabel={userRoleLabel}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col"
      />
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-hidden="true">
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
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
          className="fixed inset-y-0 left-0 z-50 flex w-[18rem] max-w-[calc(100vw-2rem)] flex-col shadow-2xl lg:hidden"
          onNavigate={() => setIsMobileSidebarOpen(false)}
          onClose={() => setIsMobileSidebarOpen(false)}
          showCloseButton
        />
      ) : null}
      <div className="min-h-screen lg:pl-64">
        <AppTopbar
          activeLabel={activeItem?.label ?? "Dashboard"}
          activeDescription={activeItem?.description}
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
          capabilities={capabilities}
          onOpenNavigation={() => setIsMobileSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
