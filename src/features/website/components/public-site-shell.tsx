'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Mail, MapPin, Menu, PhoneCall, X } from 'lucide-react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import type { WebsiteShellData } from '@/features/website/types';
import { cn } from '@/lib/utils';

const OFFICIAL_WEBSITE_LOGO_SRC =
  '/brand/website-official-logo-transparent.png';
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/SayAutomotive1';
const STORE_HOURS = {
  weekdays: 'Monday–Saturday: 7:00 AM–5:00 PM',
  sunday: 'Sunday: Closed',
} as const;

const publicNavLinks = [
  {
    href: '/',
    label: 'Home',
    exact: true,
  },
  {
    href: '/#services',
    label: 'Services',
  },
  {
    href: '/catalog',
    label: 'Catalog',
  },
  {
    href: '/#brands',
    label: 'Brands',
  },
  {
    href: '/#about-us',
    label: 'About Us',
  },
  {
    href: '/#why-choose-us',
    label: 'Why Choose Us',
  },
  {
    href: '/#reviews',
    label: 'Reviews',
  },
  {
    href: '/contact',
    label: 'Contact',
  },
] as const;

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (href.startsWith('/#')) {
    return false;
  }

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
        'group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] transition',
        isActive ? 'text-white' : 'text-white/78 hover:text-white',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'h-px w-0 bg-brand-red transition-all duration-200',
          isActive ? 'w-10' : 'group-hover:w-6',
        )}
      />
    </Link>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 transition hover:text-white"
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
  const isQuoteActive = pathname === '/get-quote';
  const websiteLogoSrc = OFFICIAL_WEBSITE_LOGO_SRC;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030B18] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030B18]/84 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center">
            <BrandLogo
              src={websiteLogoSrc}
              alt={shellData.businessName}
              width={320}
              height={120}
              className="h-10 w-auto max-w-[164px] shrink-0 object-contain sm:h-11 sm:max-w-[190px] lg:h-12 lg:max-w-[220px]"
              priority
              sizes="(max-width: 639px) 164px, (max-width: 1023px) 190px, 220px"
              surface="dark"
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {publicNavLinks.map((link) => (
              <PublicNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                exact={'exact' in link ? link.exact : undefined}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="yellowPrimary"
              size="pill"
              className={cn(
                'hidden h-11 rounded-xl px-5 text-sm font-semibold uppercase tracking-[0.16em] shadow-[0_18px_36px_rgba(214,40,40,0.24)] sm:inline-flex',
                isQuoteActive &&
                  'ring-2 ring-white/40 ring-offset-2 ring-offset-[#030B18]',
              )}
            >
              <Link
                href="/get-quote"
                aria-current={isQuoteActive ? 'page' : undefined}
              >
                Service Quote
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-white/10 bg-[#061326]/96 px-4 py-4 shadow-[0_24px_48px_rgba(0,0,0,0.28)] lg:hidden">
            <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3">
              {publicNavLinks.map((link) => (
                <PublicNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  exact={'exact' in link ? link.exact : undefined}
                  onSelect={() => setMobileMenuOpen(false)}
                />
              ))}

              <Button
                asChild
                variant="yellowPrimary"
                size="pill"
                className={cn(
                  'mt-2 h-11 w-full justify-center rounded-xl text-sm font-semibold uppercase tracking-[0.16em]',
                  isQuoteActive &&
                    'ring-2 ring-white/40 ring-offset-2 ring-offset-[#061326]',
                )}
              >
                <Link
                  href="/get-quote"
                  aria-current={isQuoteActive ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Service Quote
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1 bg-[#030B18]">{children}</main>

      <footer className="border-t border-white/10 bg-[#020817]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-x-8 gap-y-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_0.8fr_1fr_0.9fr]">
            <div className="space-y-5 md:col-span-2 lg:col-span-1">
              <BrandLogo
                src={websiteLogoSrc}
                alt={shellData.businessName}
                width={320}
                height={120}
                className="h-12 w-auto max-w-[210px] object-contain"
                surface="dark"
              />
              <p className="max-w-md text-sm leading-7 text-white/68">
                Professional auto care and repair services you can trust.
                Quality work. Honest service.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/44">
                Quick Links
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {publicNavLinks.map((link) => (
                  <FooterLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/44">
                Contact Us
              </p>
              <div className="mt-5 space-y-4 text-sm text-white/70">
                {shellData.contactNumber ? (
                  <div className="flex items-start gap-3">
                    <PhoneCall className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <span>{shellData.contactNumber}</span>
                  </div>
                ) : null}
                {shellData.email ? (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <span>{shellData.email}</span>
                  </div>
                ) : null}
                {shellData.address ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <span>{shellData.address}</span>
                  </div>
                ) : null}
                <a
                  href={FACEBOOK_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit SAY Auto Care on Facebook"
                  className="inline-flex items-center gap-3 text-slate-300 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-sm font-bold text-white">
                    f
                  </span>
                  <span className="text-sm">
                    SAY Auto Care Center / Mags & Tires
                  </span>
                </a>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/44">
                Store Hours
              </p>
              <div className="mt-5 space-y-2 text-sm leading-7 text-white/70">
                <p>{STORE_HOURS.weekdays}</p>
                <p>{STORE_HOURS.sunday}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 text-sm text-white/46 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 SAY Auto Care. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
