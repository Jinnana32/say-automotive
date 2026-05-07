'use client';

import Link from 'next/link';
import { Menu, Plus } from 'lucide-react';

import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import type { AppCapability } from '@/lib/auth/permissions';

export function AppTopbar({
  activeLabel,
  activeDescription,
  userDisplayName,
  userRoleLabel,
  capabilities,
  onOpenNavigation,
}: {
  activeLabel: string;
  activeDescription?: string;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
  onOpenNavigation?: () => void;
}) {
  const quickAction = capabilities.includes('quotations:write')
    ? { href: '/quotations/new', label: 'New quotation' }
    : capabilities.includes('customers:write')
      ? { href: '/customers/new', label: 'New customer' }
      : capabilities.includes('pos:write')
        ? { href: '/pos', label: 'Open POS' }
        : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-3 lg:hidden">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{activeLabel}</p>
            {activeDescription ? (
              <p className="mt-1 text-xs text-muted-foreground">{activeDescription}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onOpenNavigation}
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <SearchInput
              aria-label="Global search placeholder"
              placeholder="Search records, job orders, invoices..."
            />
          </div>
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-semibold text-foreground">{activeLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeDescription ?? `${userDisplayName} · ${userRoleLabel}`}
              </p>
            </div>
            {quickAction ? (
              <Button variant="outline" asChild className="shrink-0">
                <Link href={quickAction.href}>
                  <Plus className="size-4" />
                  {quickAction.label}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
