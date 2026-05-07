"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CarFront,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings2,
  ShoppingCart,
  ShieldCheck,
  ScanSearch,
  HandCoins,
  Truck,
  Users,
  UserSquare2,
  Wrench,
  WalletCards,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import type { NavigationGroup, NavigationIconName } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ICONS: Record<NavigationIconName, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  "quick-access": ScanSearch,
  customers: Users,
  vehicles: CarFront,
  quotations: FileText,
  "job-orders": ClipboardList,
  inventory: Boxes,
  products: Package,
  services: Wrench,
  suppliers: Truck,
  invoices: ReceiptText,
  payments: WalletCards,
  pos: ShoppingCart,
  staff: UserSquare2,
  attendance: Clock3,
  payroll: HandCoins,
  reports: BarChart3,
  settings: Settings2,
};

export function AppSidebar({
  navigationItems,
  userDisplayName,
  userRoleLabel,
  className,
  onNavigate,
  onClose,
  showCloseButton = false,
}: {
  navigationItems: ReadonlyArray<{
    href: string;
    label: string;
    group: NavigationGroup;
    iconName: NavigationIconName;
    showInSidebar?: boolean;
    showAsMobileShortcut?: boolean;
  }>;
  userDisplayName: string;
  userRoleLabel: string;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const pathname = usePathname();
  const mobileShortcutItems = navigationItems.filter((item) => item.showAsMobileShortcut);

  const groupedItems = navigationItems.reduce<Record<NavigationGroup, typeof navigationItems>>(
    (groups, item) => {
      if (item.showInSidebar === false) {
        return groups;
      }

      const existing = groups[item.group] ?? [];
      groups[item.group] = [...existing, item];
      return groups;
    },
    {
      Overview: [],
      "Service Desk": [],
      "Stock & Catalog": [],
      Billing: [],
      People: [],
      Insights: [],
      System: [],
    },
  );

  return (
    <aside
      className={cn(
        "border-r border-border bg-card/95 backdrop-blur",
        className,
      )}
    >
      <div className="flex h-full flex-col px-4 py-5">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">SAY Auto Care</p>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <nav className="mt-5 flex-1 overflow-y-auto pr-1">
          <div className="space-y-5">
            {Object.entries(groupedItems)
              .filter(([, items]) => items.length > 0)
              .map(([group, items]) => (
                <div key={group} className="space-y-1.5">
                  {showCloseButton && group === "Overview" && mobileShortcutItems.length > 0 ? (
                    <div className="space-y-2 pb-1">
                      {mobileShortcutItems.map((item) => {
                        const Icon = ICONS[item.iconName];

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-3 text-left text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/15"
                          >
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p>{item.label}</p>
                              <p className="mt-0.5 text-xs font-medium text-primary/80">
                                Pull up customer and vehicle records fast
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = ICONS[item.iconName];
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                              : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </nav>

        <div className="mt-4 rounded-2xl border border-border/80 bg-muted/25 p-3">
          <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {userRoleLabel}
          </p>
          <form action={signOutAction} className="mt-3">
            <Button type="submit" variant="outline" className="w-full justify-center">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
