'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';

import { UserAccountMenu } from '@/components/shared/user-account-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AppTopbar({
  activeLabel,
  activeDescription,
  userDisplayName,
  userRoleLabel,
  onOpenNavigation,
  onToggleDesktopSidebar,
}: {
  activeLabel: string;
  activeDescription?: string;
  userDisplayName: string;
  userRoleLabel: string;
  onOpenNavigation?: () => void;
  onToggleDesktopSidebar?: () => void;
}) {
  const router = useRouter();
  const searchInputBaseId = useId();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const destination = resolveGlobalSearchDestination(searchQuery);

    if (!destination) {
      return;
    }

    router.push(destination);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-3 xl:hidden">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 rounded-2xl border border-border/70 bg-background shadow-sm"
              onClick={onOpenNavigation}
              aria-label="Toggle sidebar"
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{activeLabel}</p>
              {activeDescription ? (
                <p className="mt-1 text-xs text-muted-foreground">{activeDescription}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderIconButton label="Notifications coming soon">
              <Bell className="size-4" />
            </HeaderIconButton>
            <UserAccountMenu userDisplayName={userDisplayName} userRoleLabel={userRoleLabel} compact />
          </div>
        </div>

        <div className="xl:hidden">
          <GlobalSearchForm
            inputId={`${searchInputBaseId}-mobile`}
            value={searchQuery}
            onValueChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
          />
        </div>

        <div className="hidden items-center gap-6 xl:flex">
          <div className="flex min-w-0 shrink-0 items-start gap-3 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 rounded-2xl border border-border/70 bg-background shadow-sm"
              onClick={onToggleDesktopSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary/75">Workspace</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">{activeLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeDescription ?? `${userDisplayName} · ${userRoleLabel}`}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="mx-auto w-full max-w-2xl">
              <GlobalSearchForm
                inputId={`${searchInputBaseId}-desktop`}
                value={searchQuery}
                onValueChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HeaderIconButton label="Notifications coming soon">
              <Bell className="size-4" />
            </HeaderIconButton>
            <UserAccountMenu userDisplayName={userDisplayName} userRoleLabel={userRoleLabel} />
          </div>
        </div>
      </div>
    </header>
  );
}

function GlobalSearchForm({
  inputId,
  value,
  onValueChange,
  onSubmit,
}: {
  inputId: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor={inputId} className="sr-only">
        Search customers, vehicles, job orders, and documents
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Search customers, vehicles, job orders..."
          className="h-11 rounded-full border-border/70 bg-muted/35 pl-11 pr-4 shadow-sm transition-colors focus-visible:bg-background"
        />
      </div>
    </form>
  );
}

function HeaderIconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-2xl border border-border/70 bg-background shadow-sm"
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

function resolveGlobalSearchDestination(query: string) {
  const value = query.trim();

  if (!value) {
    return null;
  }

  const encodedValue = encodeURIComponent(value);
  const normalized = value.toUpperCase();

  if (/^(QT|QTN|QUOT)/.test(normalized)) {
    return `/quotations?search=${encodedValue}`;
  }

  if (/^(JO|JOB|WO|WORK)/.test(normalized)) {
    return `/job-orders?search=${encodedValue}`;
  }

  if (/^(INV|SI|BILL)/.test(normalized)) {
    return `/invoices?search=${encodedValue}`;
  }

  if (/^(PAY|OR|RCPT|REC)/.test(normalized)) {
    return `/payments?search=${encodedValue}`;
  }

  if (looksLikePlateLookup(value)) {
    return `/quick-access?plate=${encodedValue}`;
  }

  return `/customers?search=${encodedValue}`;
}

function looksLikePlateLookup(value: string) {
  const normalized = value.trim().toUpperCase();

  if (!normalized) {
    return false;
  }

  return /\d/.test(normalized) || /[- ]/.test(normalized);
}
