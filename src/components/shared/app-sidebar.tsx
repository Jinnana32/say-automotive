'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  ScanSearch,
  HandCoins,
  Truck,
  Users,
  UserSquare2,
  Globe,
  Wrench,
  WalletCards,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  navigationItemMatchesPath,
  resolveActiveNavigationItem,
  type NavigationGroup,
  type NavigationIconName,
} from '@/lib/navigation';
import { cn } from '@/lib/utils';

const ICONS: Record<
  NavigationIconName,
  React.ComponentType<{ className?: string }>
> = {
  dashboard: LayoutDashboard,
  'quick-access': ScanSearch,
  customers: Users,
  vehicles: CarFront,
  quotations: FileText,
  'job-orders': ClipboardList,
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
  website: Globe,
  settings: Settings2,
};

const SIDEBAR_ACTIVE_NAVY = '#061B3A';

export function AppSidebar({
  navigationItems,
  businessName,
  businessLogoUrl,
  showBusinessName = false,
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
  businessName: string;
  businessLogoUrl: string | null;
  showBusinessName?: boolean;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const pathname = usePathname();
  const mobileShortcutItems = navigationItems.filter(
    (item) => item.showAsMobileShortcut,
  );
  const activeItem = resolveActiveNavigationItem(navigationItems, pathname);

  const groupedItems = navigationItems.reduce<
    Record<NavigationGroup, typeof navigationItems>
  >(
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
      'Service Desk': [],
      'Stock & Catalog': [],
      Billing: [],
      People: [],
      Insights: [],
      System: [],
    },
  );

  return (
    <aside
      className={cn(
        'border-r border-border/70 bg-background/95 shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] backdrop-blur',
        className,
      )}
    >
      <div className="flex h-full flex-col px-4 py-4">
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b border-border/70',
            showBusinessName ? 'pb-4' : 'pb-3',
          )}
        >
          <div className="min-w-0 flex-1">
            {showBusinessName ? (
              <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-white p-2 shadow-sm">
                  <Image
                    src={businessLogoUrl ?? '/say-auto-care-logo.jpeg'}
                    alt={businessName}
                    width={120}
                    height={120}
                    className="max-h-12 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/70">
                    SAY Auto Care
                  </p>
                  <p className="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-foreground">
                    {businessName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Workshop administration
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[4.1rem] w-full items-center py-1 pl-1 pr-2">
                <Image
                  src={businessLogoUrl ?? '/say-auto-care-logo.jpeg'}
                  alt={businessName}
                  width={520}
                  height={140}
                  className="h-auto w-full max-w-[14.75rem] object-contain object-left"
                  priority
                />
              </div>
            )}
          </div>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-2xl border border-border/70 bg-background xl:hidden"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-5">
            {Object.entries(groupedItems)
              .filter(([, items]) => items.length > 0)
              .map(([group, items]) => (
                <div key={group} className="space-y-2">
                  {showCloseButton &&
                  group === 'Overview' &&
                  mobileShortcutItems.length > 0 ? (
                    <div className="space-y-2 pb-1">
                      {mobileShortcutItems.map((item) => {
                        const Icon = ICONS[item.iconName];

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className="flex w-full items-center gap-3 rounded-3xl px-3.5 py-3 text-left text-[0.95rem] font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                            style={{
                              backgroundColor: SIDEBAR_ACTIVE_NAVY,
                              boxShadow: '0 18px 32px -22px rgba(6, 27, 58, 0.75)',
                            }}
                          >
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p>{item.label}</p>
                              <p className="mt-0.5 text-[0.8rem] font-medium text-primary-foreground/80">
                                Pull up customer and vehicle records fast
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                  <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
                    {group}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const Icon = ICONS[item.iconName];
                      const isActive =
                        activeItem?.href === item.href &&
                        navigationItemMatchesPath(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            'group flex items-center gap-3 rounded-2xl px-3 py-3 text-[0.95rem] transition-all',
                            isActive
                              ? 'text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-[#061B3A]',
                          )}
                          style={
                            isActive
                              ? {
                                  backgroundColor: SIDEBAR_ACTIVE_NAVY,
                                  boxShadow: '0 16px 28px -22px rgba(6, 27, 58, 0.8)',
                                }
                              : undefined
                          }
                          >
                            <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#061B3A]',
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="truncate font-medium leading-none">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </nav>

        <div className="mt-5 border-t border-border/60 px-3 pt-4">
          <p className="text-sm font-medium text-slate-700">SAY Auto Care Admin</p>
          <p className="mt-1 text-xs text-slate-500">© 2023 All rights reserved.</p>
        </div>
      </div>
    </aside>
  );
}
