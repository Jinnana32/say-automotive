'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { signOutAction } from '@/features/auth/actions/auth-actions';
import { cn } from '@/lib/utils';

const PORTAL_NAV_ITEMS = [
  { href: '/portal/attendance', label: 'Attendance' },
  { href: '/portal/history', label: 'History' },
  { href: '/portal/amendments', label: 'Correction Requests' },
  { href: '/portal/profile', label: 'Profile' },
] as const;

export function MechanicPortalMenu() {
  const pathname = usePathname();

  return (
    <details className="group relative">
      <summary className="flex size-11 list-none cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm [&::-webkit-details-marker]:hidden">
        <Menu className="size-5" />
        <span className="sr-only">Open portal menu</span>
      </summary>

      <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="space-y-1">
          {PORTAL_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex rounded-xl px-3 py-2 text-sm transition',
                pathname === item.href
                  ? 'bg-[#081735] text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
              onClick={(event) => closeMenu(event.currentTarget)}
            >
              {item.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              onClick={(event) => closeMenu(event.currentTarget)}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}

function closeMenu(target: HTMLElement) {
  const details = target.closest('details');

  if (details instanceof HTMLDetailsElement) {
    details.open = false;
  }
}
