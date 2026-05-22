'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { DEFAULT_BRAND_LOGO_SRC } from '@/components/shared/brand-assets';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import type { WebsiteShellData } from '@/features/website/types';
import { cn } from '@/lib/utils';

const publicNavLinks = [
  {
    href: '/',
    label: 'Home',
    exact: true,
  },
  {
    href: '/catalog',
    label: 'Catalog',
  },
  {
    href: '/garage-journal',
    label: 'Shop Updates',
  },
  {
    href: '/contact',
    label: 'Contact Us',
  },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function PublicNavLink({
  href,
  label,
  exact,
  onSelect,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onSelect?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href, exact);

  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'rounded-full px-3 py-2 transition hover:text-[#173c99]',
        isActive ? 'bg-[#eef3ff] text-[#173c99] shadow-sm' : 'text-[#223255]',
      )}
    >
      {label}
    </Link>
  );
}

export function PublicSiteShell({
  shellData,
  children,
}: {
  shellData: WebsiteShellData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isQuoteActive = isActivePath(pathname, '/get-quote');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f3f5fa] text-[#10224d]">
      <header className="sticky top-0 z-20 border-b border-[#d6deef] bg-white/96 shadow-[0_12px_30px_rgba(9,26,79,0.08)] backdrop-blur">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ffd24a_0%,#0f2d83_38%,#173c99_100%)]" />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
            <div className="flex min-w-0 items-center gap-2.5 md:hidden">
              <BrandLogo
                alt={`${shellData.businessName} shield`}
                variant="mark"
                width={56}
                height={56}
                className="h-11 w-11 shrink-0 object-contain"
                priority
              />
              <div className="min-w-0 leading-none">
                <p className="truncate text-[1.55rem] font-black italic tracking-[-0.08em] text-[#173c99]">
                  SAY
                </p>
                <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#5c6a8a]">
                  Auto Care
                </p>
              </div>
            </div>

            <BrandLogo
              src={shellData.businessLogoUrl ?? DEFAULT_BRAND_LOGO_SRC}
              alt={shellData.businessName}
              width={240}
              height={192}
              className="hidden h-11 w-auto sm:h-12 md:block md:h-14 md:max-w-none"
              priority
            />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-base font-semibold uppercase tracking-[0.12em] text-[#173c99]">
                {shellData.businessName}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5c6a8a]">
                Pinoy craftsmanship. American precision.
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-x-2 gap-y-2 text-[15px] font-medium md:flex">
            {publicNavLinks.map((link) => (
              <PublicNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                exact={link.exact}
              />
            ))}

            <Button
              asChild
              variant="yellowPrimary"
              size="pill"
              className={cn(
                'h-10 px-5',
                isQuoteActive &&
                  'ring-2 ring-[#173c99] ring-offset-2 ring-offset-white',
              )}
            >
              <Link
                href="/get-quote"
                aria-current={isQuoteActive ? 'page' : undefined}
              >
                Service Quote
              </Link>
            </Button>
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-2xl border border-[#d6deef] bg-white text-[#173c99] shadow-sm md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[#d6deef] bg-white px-4 py-3 shadow-[0_18px_32px_rgba(9,26,79,0.08)] md:hidden">
            <nav className="mx-auto flex w-full max-w-7xl flex-col gap-2">
              {publicNavLinks.map((link) => (
                <PublicNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  exact={link.exact}
                  onSelect={() => setMobileMenuOpen(false)}
                />
              ))}

              <Button
                asChild
                variant="yellowPrimary"
                size="pill"
                className={cn(
                  'mt-2 h-11 w-full justify-center',
                  isQuoteActive &&
                    'ring-2 ring-[#173c99] ring-offset-2 ring-offset-white',
                )}
              >
                <Link
                  href="/get-quote"
                  aria-current={isQuoteActive ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Service Quote
                </Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      {/* keep your existing footer unchanged */}
    </div>
  );
}
