import { AppShell } from "@/components/shared/app-shell";
import { DASHBOARD_NAV_ITEMS } from "@/lib/navigation";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Administrator",
  mechanic: "Mechanic",
  cashier: "Cashier",
  inventory_staff: "Inventory Staff",
  service_advisor: "Service Advisor",
} as const;

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireAuthenticatedStaff();
  const navigationItems = DASHBOARD_NAV_ITEMS.filter((item) =>
    context.capabilities.includes(item.capability),
  ).map(({ capability: _capability, ...item }) => item);

  return (
    <AppShell
      navigationItems={navigationItems}
      userDisplayName={context.displayName}
      userRoleLabel={ROLE_LABELS[context.role]}
      capabilities={context.capabilities}
    >
      {children}
    </AppShell>
  );
}
