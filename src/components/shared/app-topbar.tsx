'use client';

import Link from 'next/link';
import { CalendarDays, CircleUserRound, Plus } from 'lucide-react';

import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import type { AppCapability } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

export function AppTopbar({
  activeLabel,
  activeDescription,
  userDisplayName,
  userRoleLabel,
  capabilities,
}: {
  activeLabel: string;
  activeDescription?: string;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <SearchInput
              aria-label="Global search placeholder"
              placeholder="Search records, job orders, invoices..."
            />
          </div>
          <div className="flex items-center gap-2">
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
