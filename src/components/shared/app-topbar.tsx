'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, FileText, Menu, Plus, Search, UserPlus } from 'lucide-react';

import { UserAccountMenu } from '@/components/shared/user-account-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { resolveQuickAccessQuery } from '@/features/quick-access/utils';
import type { AppCapability } from '@/lib/auth/permissions';

export function AppTopbar({
  activeLabel,
  userDisplayName,
  userRoleLabel,
  capabilities,
  onOpenNavigation,
}: {
  activeLabel: string;
  userDisplayName: string;
  userRoleLabel: string;
  capabilities: readonly AppCapability[];
  onOpenNavigation?: () => void;
}) {
  const router = useRouter();
  const searchInputBaseId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const createActions = buildCreateActions(capabilities);

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
        <div className="flex items-start justify-between gap-3 md:hidden">
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
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Workspace
              </p>
              <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{activeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreateActionsMenu actions={createActions} />
            <UserAccountMenu userDisplayName={userDisplayName} userRoleLabel={userRoleLabel} compact />
          </div>
        </div>

        <div className="md:hidden">
          <GlobalSearchForm
            inputId={`${searchInputBaseId}-mobile`}
            value={searchQuery}
            onValueChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
          />
        </div>

        <div className="hidden items-center justify-between gap-6 md:flex">
          <div className="min-w-0 flex-1">
            <div className="w-full max-w-2xl">
              <GlobalSearchForm
                inputId={`${searchInputBaseId}-desktop`}
                value={searchQuery}
                onValueChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CreateActionsMenu actions={createActions} />
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
        Search customer or vehicle records
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Search customer or plate number..."
          className="h-11 rounded-full border-border/70 bg-muted/35 pl-11 pr-4 shadow-sm transition-colors focus-visible:bg-background"
        />
      </div>
    </form>
  );
}

function CreateActionsMenu({
  actions,
}: {
  actions: ReadonlyArray<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  const router = useRouter();

  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-full border border-brand-red/20 bg-brand-red/[0.08] px-3 text-brand-red shadow-sm hover:bg-brand-red/[0.14] hover:text-brand-redDark focus-visible:ring-brand-red/20"
          aria-label="Create new"
          title="Create new"
        >
          <span className="hidden text-sm font-semibold sm:inline">New</span>
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <DropdownMenuItem
              key={action.href}
              onSelect={() => router.push(action.href)}
            >
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function resolveGlobalSearchDestination(query: string) {
  const value = query.trim();

  if (!value) {
    return null;
  }

  const resolvedQuery = resolveQuickAccessQuery(value);
  const lookupValue =
    resolvedQuery.plateQuery || resolvedQuery.customerLastNameQuery;

  return lookupValue
    ? `/quick-access?q=${encodeURIComponent(lookupValue)}`
    : null;
}

function buildCreateActions(capabilities: readonly AppCapability[]) {
  const actions: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [];

  if (capabilities.includes('quotations:write')) {
    actions.push({
      href: '/quotations/new',
      label: 'New quotation',
      icon: FileText,
    });
  }

  if (capabilities.includes('customers:write')) {
    actions.push({
      href: '/customers/new',
      label: 'New customer',
      icon: UserPlus,
    });
  }

  if (capabilities.includes('vehicles:write')) {
    actions.push({
      href: '/vehicles/new',
      label: 'New vehicle',
      icon: CarFront,
    });
  }

  return actions;
}
