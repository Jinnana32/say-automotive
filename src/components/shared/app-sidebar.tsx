'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  CarFront,
  ChevronLeft,
  ChevronRight,
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

import { DEFAULT_BRAND_LOGO_SRC } from '@/components/shared/brand-assets';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/brand-logo';
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
  documents: FileText,
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

const SIDEBAR_ACTIVE_NAVY = '#0B1F4D';

export function AppSidebar({
  navigationItems,
  businessName,
  businessLogoUrl,
  showBusinessName = false,
  collapsed = false,
  className,
  onNavigate,
  onClose,
  onToggleCollapse,
  showCloseButton = false,
  showCollapseButton = false,
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
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  showCloseButton?: boolean;
  showCollapseButton?: boolean;
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
        'overflow-visible border-r border-border/70 bg-background/95 shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] backdrop-blur',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col py-4',
          collapsed ? 'px-2.5' : 'px-3.5',
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b border-border/70',
            collapsed ? 'pb-3' : showBusinessName ? 'pb-4' : 'pb-3',
          )}
        >
          <div className="min-w-0 flex-1">
            {collapsed ? (
              <div className="flex min-h-[3.75rem] items-center justify-center py-0.5">
                <BrandLogo
                  alt={`${businessName} mark`}
                  variant="mark"
                  width={64}
                  height={64}
                  className="size-[3.4rem] object-contain"
                  priority
                  fallbackClassName="size-[3.4rem]"
                />
              </div>
            ) : showBusinessName ? (
              <div className="flex items-start gap-3">
                <div className="flex min-h-[3.25rem] shrink-0 items-center py-0.5">
                  <BrandLogo
                    src={businessLogoUrl ?? DEFAULT_BRAND_LOGO_SRC}
                    alt={businessName}
                    width={220}
                    height={66}
                    className="h-auto w-[10.75rem] object-contain object-left mix-blend-multiply"
                    priority
                    fallbackClassName="w-[10.75rem]"
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
              <div className="flex min-h-[3.25rem] w-full items-center py-0.5 pl-0.5 pr-1">
                <BrandLogo
                  src={businessLogoUrl ?? DEFAULT_BRAND_LOGO_SRC}
                  alt={businessName}
                  width={520}
                  height={140}
                  className="h-auto w-full max-w-[12.5rem] object-contain object-left mix-blend-multiply"
                  priority
                  fallbackClassName="w-full max-w-[12.5rem]"
                />
              </div>
            )}
          </div>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-2xl border border-border/70 bg-background md:hidden"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <nav
          className={cn(
            'mt-3 flex-1 overflow-y-auto',
            collapsed ? 'pr-0' : 'pr-1',
          )}
        >
          <div className={cn(collapsed ? 'space-y-4' : 'space-y-5')}>
            {Object.entries(groupedItems)
              .filter(([, items]) => items.length > 0)
              .map(([group, items]) => (
                <div
                  key={group}
                  className={cn(collapsed ? 'space-y-1.5' : 'space-y-2')}
                >
                  {showCloseButton &&
                  group === 'Overview' &&
                  mobileShortcutItems.length > 0 &&
                  !collapsed ? (
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
                  {collapsed ? (
                    <div className="mx-auto h-px w-8 bg-border/70" />
                  ) : (
                    <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
                      {group}
                    </p>
                  )}
                  <div className={cn(collapsed ? 'space-y-1' : 'space-y-1.5')}>
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
                          aria-label={item.label}
                          title={item.label}
                          className={cn(
                            'group flex rounded-2xl text-[0.95rem] transition-all',
                            collapsed
                              ? 'justify-center px-2 py-3'
                              : 'items-center gap-3 px-3 py-3',
                            isActive
                              ? 'text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-brand-navy',
                          )}
                          style={
                            isActive
                              ? {
                                  backgroundColor: SIDEBAR_ACTIVE_NAVY,
                                  boxShadow: '0 16px 28px -22px rgba(11, 31, 77, 0.8)',
                                }
                              : undefined
                          }
                        >
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand-navy',
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          {!collapsed ? (
                            <span className="truncate font-medium leading-none">
                              {item.label}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </nav>

        <div className="relative mt-5 border-t border-border/60 px-1 pt-4">
          {!collapsed ? (
            <>
              <p className="text-sm font-medium text-slate-700">
                SAY Auto Care Admin
              </p>
              <p className="mt-1 text-xs text-slate-500">
                © 2024 All rights reserved.
              </p>
            </>
          ) : (
            <div className="h-9" aria-hidden="true" />
          )}
          {showCollapseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'absolute right-[-0.875rem] top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-2 border-white text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-[#10295f]',
                collapsed ? 'bg-[#10295f]' : 'bg-[#0B1F4D]',
              )}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
