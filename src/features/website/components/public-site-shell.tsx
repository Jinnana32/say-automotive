'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { websiteCardVariants } from '@/features/website/components/website-card-variants';
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
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href, exact);

  return (
    <Link
      href={href}
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
  const isQuoteActive = isActivePath(pathname, '/get-quote');

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#10224d]">
      <header className="sticky top-0 z-20 border-b border-[#d6deef] bg-white/96 shadow-[0_12px_30px_rgba(9,26,79,0.08)] bg-white">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ffd24a_0%,#0f2d83_38%,#173c99_100%)]" />
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src={shellData.businessLogoUrl ?? "/say-auto-care-logo.jpeg"}
              alt={shellData.businessName}
              width={240}
              height={192}
              className="h-14 w-auto rounded-sm object-contain sm:h-16"
              priority
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-base font-semibold uppercase tracking-[0.12em] text-[#173c99]">
                {shellData.businessName}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5c6a8a]">
                Pinoy craftsmanship. American precision.
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[15px] font-medium">
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
        </div>
      </header>

      <main>{children}</main>

      {/* keep your existing footer unchanged */}
    </div>
  );
}
