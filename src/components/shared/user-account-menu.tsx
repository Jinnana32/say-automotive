'use client';

import { useId } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { cn } from '@/lib/utils';

export function UserAccountMenu({
  userDisplayName,
  userRoleLabel,
  compact = false,
}: {
  userDisplayName: string;
  userRoleLabel: string;
  compact?: boolean;
}) {
  const signOutFormId = useId();
  const initials = buildInitials(userDisplayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-2.5 py-1.5 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
            compact && 'gap-2 px-1.5 py-1.5 sm:rounded-full',
          )}
          aria-label="Open user account menu"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
            {initials}
          </span>
          <span className={cn('min-w-0', compact && 'hidden sm:block')}>
            <span className="block truncate text-sm font-medium text-foreground">
              {userDisplayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {userRoleLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground',
              compact && 'hidden sm:block',
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <div className="px-2.5 py-2">
          <p className="text-sm font-semibold text-foreground">
            {userDisplayName}
          </p>
          <p className="text-xs text-muted-foreground">{userRoleLabel}</p>
        </div>
        <DropdownMenuSeparator />
        <form id={signOutFormId} action={signOutAction}>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              const form = document.getElementById(
                signOutFormId,
              ) as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildInitials(value: string) {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) {
    return 'U';
  }

  return tokens.map((token) => token.charAt(0).toUpperCase()).join('');
}
