"use client";

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
  }>;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
}>) {
  const pathname = usePathname();
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
      />
      <div className="min-h-screen lg:pl-64">
        <AppTopbar
          activeLabel={activeItem?.label ?? "Dashboard"}
          activeDescription={activeItem?.description}
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
          capabilities={capabilities}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
