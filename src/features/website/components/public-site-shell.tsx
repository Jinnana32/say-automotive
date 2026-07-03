'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Clock, Mail, MapPin, Menu, PhoneCall, X } from 'lucide-react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import type { WebsiteShellData } from '@/features/website/types';
import { cn } from '@/lib/utils';

const OFFICIAL_WEBSITE_LOGO_SRC =
  '/brand/website-official-logo-transparent.png';
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/SayAutomotive1';
const FACEBOOK_LABEL = 'SAY Auto Care Center / Mags & Tires';
const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/SAY+Auto+Care+Center+%2F+Mags+%26+Tires/@10.7204706,122.5314177,17z/data=!3m1!4b1!4m6!3m5!1s0x33aefb11f1e70e4f:0x551d5bca1b30e393!8m2!3d10.7204653!4d122.5339926!16s%2Fg%2F11y2dx8r3_';
const STORE_HOURS = {
  weekdaysLabel: 'Monday – Saturday',
  weekdaysTime: '7:00 AM – 5:00 PM',
  sundayLabel: 'Sunday',
  sundayTime: 'Closed',
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
        'group inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.14em] transition',
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

function FooterSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white sm:text-sm">
        {children}
      </p>
      <span className="mt-2 block h-px w-10 bg-brand-red" aria-hidden="true" />
    </div>
  );
}

function FooterSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('pb-7 last:pb-0 md:pb-0', className)}>
      {children}
    </section>
  );
}

function FooterIconBadge({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand-red/40 bg-brand-red/10 text-brand-red">
      <Icon className="size-4 shrink-0" />
    </span>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm leading-6 text-[#a8b0c2] transition hover:text-white md:text-white/70"
    >
      {label}
    </Link>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 8.5V6.75c0-.69.56-1.25 1.25-1.25H16V3h-2.03c-2.07 0-3.72 1.68-3.72 3.75V8.5H9v2.75h1.25V21h3.25v-9.75H16l.5-2.75H13.5Z" />
    </svg>
  );
}

function FooterContactRow({
  icon: Icon,
  href,
  external,
  ariaLabel,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <FooterIconBadge icon={Icon} />
      <span className="min-w-0 self-center text-sm leading-snug text-[#a8b0c2] transition group-hover:text-white md:text-white/70">
        {children}
      </span>
    </>
  );
  const rowClassName = 'group flex items-start gap-3';

  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={rowClassName}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : undefined)}
      >
        {content}
      </a>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}

function formatPhoneHref(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return undefined;
  }

  if (digits.startsWith('0')) {
    return `tel:+63${digits.slice(1)}`;
  }

  return `tel:+${digits}`;
}

function FooterHoursRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <FooterIconBadge icon={Icon} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug text-white">{label}</p>
        <p className="text-sm leading-snug text-[#a8b0c2] md:text-white/70">{value}</p>
      </div>
    </div>
  );
}

function FooterStoreHoursCard() {
  return (
    <div className="space-y-0">
      <FooterHoursRow
        icon={Clock}
        label={STORE_HOURS.weekdaysLabel}
        value={STORE_HOURS.weekdaysTime}
      />
      <FooterHoursRow
        icon={CalendarDays}
        label={STORE_HOURS.sundayLabel}
        value={STORE_HOURS.sundayTime}
      />
    </div>
  );
}

export function PublicSiteShell({
  shellData,
  children,
}: {
  shellData: WebsiteShellData;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const websiteLogoSrc = OFFICIAL_WEBSITE_LOGO_SRC;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030B18] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030B18]/84 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center">
            <BrandLogo
              src={websiteLogoSrc}
              alt={shellData.businessName}
              width={320}
              height={120}
              className="h-[3.08rem] w-auto max-w-[206px] shrink-0 object-contain sm:h-[3.36rem] sm:max-w-[240px] lg:h-[3.78rem] lg:max-w-[278px]"
              priority
              sizes="(max-width: 639px) 206px, (max-width: 1023px) 240px, 278px"
              surface="dark"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:gap-5 lg:flex">
            {publicNavLinks.map((link) => (
              <PublicNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                exact={'exact' in link ? link.exact : undefined}
              />
            ))}
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white lg:hidden"
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
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1 bg-[#030B18]">{children}</main>

      <footer className="overflow-x-hidden bg-[#020817] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_42%),linear-gradient(180deg,#031024_0%,#020817_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-[minmax(0,1.2fr)_0.8fr_1fr_0.9fr]">
            <FooterSection className="space-y-4 md:col-span-2 md:space-y-5 lg:col-span-1">
              <BrandLogo
                src={websiteLogoSrc}
                alt={shellData.businessName}
                width={320}
                height={120}
                className="h-10 w-auto max-w-[9rem] object-contain sm:max-w-[10rem] md:h-12 md:max-w-[210px]"
                surface="dark"
              />
              <p className="max-w-sm text-sm leading-relaxed text-[#a8b0c2] md:max-w-md md:leading-7 md:text-white/68">
                Professional auto care and repair services you can trust.
                Quality work. Honest service.
              </p>
            </FooterSection>

            <FooterSection>
              <FooterSectionHeading>Quick Links</FooterSectionHeading>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:flex md:flex-col md:gap-3">
                {publicNavLinks.map((link) => (
                  <FooterLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
            </FooterSection>

            <FooterSection>
              <FooterSectionHeading>Contact Us</FooterSectionHeading>
              <div className="space-y-2.5 md:space-y-3">
                {shellData.contactNumber ? (
                  <FooterContactRow
                    icon={PhoneCall}
                    href={formatPhoneHref(shellData.contactNumber)}
                  >
                    {shellData.contactNumber}
                  </FooterContactRow>
                ) : null}
                {shellData.email ? (
                  <FooterContactRow
                    icon={Mail}
                    href={`mailto:${shellData.email}`}
                  >
                    {shellData.email}
                  </FooterContactRow>
                ) : null}
                {shellData.address ? (
                  <FooterContactRow
                    icon={MapPin}
                    href={GOOGLE_MAPS_URL}
                    external
                    ariaLabel={`Open ${shellData.address} in Google Maps`}
                  >
                    {shellData.address}
                  </FooterContactRow>
                ) : null}
                <FooterContactRow
                  icon={FacebookIcon}
                  href={FACEBOOK_PAGE_URL}
                  external
                  ariaLabel="Visit SAY Auto Care on Facebook"
                >
                  {FACEBOOK_LABEL}
                </FooterContactRow>
              </div>
            </FooterSection>

            <FooterSection className="md:col-span-2 lg:col-span-1">
              <FooterSectionHeading>Store Hours</FooterSectionHeading>
              <FooterStoreHoursCard />
            </FooterSection>
          </div>

          <div className="mt-8 pt-6 md:mt-10 md:pt-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-xs leading-6 text-[#a8b0c2] md:text-sm md:text-white/46">
                © 2024 SAY Auto Care. All rights reserved.
              </p>
              <div className="flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#8f98ab] md:gap-x-6 md:text-sm">
                <span className="transition hover:text-white">Privacy Policy</span>
                <span className="transition hover:text-white">Terms of Service</span>
                <span className="transition hover:text-white">Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
