import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  ArrowRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Cog,
  Disc3,
  Gauge,
  ShieldCheck,
  Snowflake,
  Star,
  Thermometer,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import type { WebsiteShellData } from '@/features/website/types';
import { cn } from '@/lib/utils';

const OFFICIAL_WEBSITE_LOGO_SRC =
  '/brand/website-official-logo-transparent.png';
const WEBSITE_HERO_BACKGROUND_SRC = '/brand/website-hero-background.png';
const WEBSITE_FEATURE_BACKGROUND_SRC = '/brand/website-feature-background.png';
const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/SAY+Auto+Care+Center+%2F+Mags+%26+Tires/@10.7204706,122.5314177,17z/data=!4m8!3m7!1s0x33aefb11f1e70e4f:0x551d5bca1b30e393!8m2!3d10.7204653!4d122.5339926!9m1!1b1!16s%2Fg%2F11y2dx8r3_';

const HERO_FEATURES = [
  { label: 'Expert Technicians', icon: Wrench },
  { label: 'Premium Equipment', icon: Gauge },
  { label: 'Quality Service', icon: ShieldCheck },
  { label: 'Customer Focused', icon: Users },
] as const;

const EXPERTISE_HIGHLIGHTS = [
  {
    title: 'FCA-Certified Mechanic',
    description:
      'Hands-on service expertise with FCA training and automotive repair experience.',
    icon: ShieldCheck,
  },
  {
    title: 'USA Certified Mechanic',
    description:
      'Certified mechanic experience from the USA with professional service standards.',
    icon: Award,
  },
  {
    title: 'Hybrid Vehicle Experience',
    description:
      'Hybrid car certified mechanic experience for modern vehicle service needs.',
    icon: Zap,
  },
  {
    title: 'Open Monday–Saturday',
    description: 'Store hours: 7:00 AM–5:00 PM. Sunday: Closed.',
    icon: Clock3,
  },
] as const;

const SERVICE_CARDS = [
  {
    title: 'Engine Repair',
    description:
      'Diagnostics, repairs, and performance support for engine issues.',
    icon: Wrench,
  },
  {
    title: 'Electrical',
    description:
      'Electrical diagnosis, wiring checks, battery-related issues, and component repair.',
    icon: Zap,
  },
  {
    title: 'Brakes',
    description: 'Brake inspection, repair, replacement, and safety checks.',
    icon: Disc3,
  },
  {
    title: 'Steering & Suspension',
    description: 'Steering, suspension, shock, and handling-related service.',
    icon: Gauge,
  },
  {
    title: 'A/C',
    description:
      'Air-conditioning inspection, cooling performance checks, and A/C service.',
    icon: Snowflake,
  },
  {
    title: 'Cooling System',
    description: 'Radiator, coolant, hose, and overheating-related service.',
    icon: Thermometer,
  },
  {
    title: 'Transmission Service',
    description:
      'Transmission inspection, fluid service, and drivetrain-related support.',
    icon: Cog,
  },
  {
    title: 'Tune-Up / Tires',
    description:
      'Tune-up service, tire checks, balancing, rotation, and related maintenance.',
    icon: CircleDot,
  },
] as const;
const BRAND_LOGOS = [
  {
    name: 'Valvoline',
    src: '/brand-logos/valvoline.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Shell Helix',
    src: '/brand-logos/new shell logo.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Mobil 1',
    src: '/brand-logos/Mobil1_logo.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Totachi',
    src: '/brand-logos/totachi-seeklogo.com_.svg',
    frameClassName: 'h-12 max-w-[220px]',
  },
  {
    name: 'Varta',
    src: '/brand-logos/Varta.png',
    frameClassName: 'h-14 max-w-[190px]',
  },
  {
    name: 'Dirty Life Race Wheels',
    src: '/brand-logos/Dirty Wheels.png',
    frameClassName: 'h-12 max-w-[220px]',
  },
  {
    name: 'Falken',
    src: '/brand-logos/Ralken.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Journey Xtreme 4x4 Tires',
    src: '/brand-logos/Journey.png',
    frameClassName: 'h-14 max-w-[220px]',
  },
  {
    name: 'Nankang',
    src: '/brand-logos/Nankang.png',
    frameClassName: 'h-12 max-w-[220px]',
  },
  {
    name: 'YSS Auto Suspension',
    src: '/brand-logos/YSS Auto.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Option 4WD',
    src: '/brand-logos/Option.png',
    frameClassName: 'h-14 max-w-[220px]',
  },
  {
    name: 'Emtrac',
    src: '/brand-logos/Emtrac-removebg-preview.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Sumaxx',
    src: '/brand-logos/Sumaxx.png',
    frameClassName: 'h-14 max-w-[220px]',
  },
  {
    name: 'ARB 4x4 Accessories',
    src: '/brand-logos/Arb.png',
    frameClassName: 'h-14 max-w-[150px]',
  },
  {
    name: 'Black Mamba',
    src: '/brand-logos/Black Mamba.png',
    frameClassName: 'h-12 max-w-[180px]',
  },
  {
    name: 'Bradley',
    src: '/brand-logos/Bradley-removebg-preview.png',
    frameClassName: 'h-12 max-w-[170px]',
  },
  {
    name: '4x Engineering',
    src: '/brand-logos/4x4 Engineering.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Explorer Extreme Performance',
    src: '/brand-logos/Explorer.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Lenso Tires',
    src: '/brand-logos/Lenso.png',
    frameClassName: 'h-14 max-w-[170px]',
  },
  {
    name: 'Warn',
    src: '/brand-logos/Warn.png',
    frameClassName: 'h-16 max-w-[130px]',
  },
  {
    name: 'Cali Off-Road',
    src: '/brand-logos/Cali.png',
    frameClassName: 'h-16 max-w-[130px]',
  },
  {
    name: 'Continental',
    src: '/brand-logos/Continental.png',
    frameClassName: 'h-14 max-w-[180px]',
  },
  {
    name: 'MaxTrek Tyres',
    src: '/brand-logos/Maxtrek.png',
    frameClassName: 'h-14 max-w-[220px]',
  },
  {
    name: 'AMP Tires',
    src: '/brand-logos/Amp.png',
    frameClassName: 'h-12 max-w-[240px]',
  },
  {
    name: 'Venom Wheels',
    src: '/brand-logos/Venom-removebg-preview.png',
    frameClassName: 'h-14 max-w-[220px]',
  },
] as const;

const TRUST_POINTS = [
  {
    title: 'FCA-Certified Mechanic',
    description:
      'Hands-on service expertise with FCA training and automotive repair experience.',
    icon: ShieldCheck,
  },
  {
    title: 'USA Certified Mechanic',
    description:
      'Certified mechanic experience from the USA with professional service standards.',
    icon: Award,
  },
  {
    title: 'Hybrid Vehicle Experience',
    description:
      'Hybrid car certified mechanic experience for modern vehicle service needs.',
    icon: Zap,
  },
  {
    title: 'Brand Service Background',
    description:
      'Experience involving FCA, Jeep, Dodge, RAM, and Firestone/Bridgestone Complete Auto Care.',
    icon: ClipboardCheck,
  },
] as const;

const GOOGLE_REVIEW_PREVIEWS = [
  {
    name: 'Joab Cano',
    meta: 'Local Guide · 25 reviews · 4 photos',
    date: 'a year ago',
    quote:
      'I was in Iloilo visiting from Kalibo. This family owned and operated business was great! Everyone was very helpful and friendly. Knowledgeable. Friendly. Good price.',
  },
  {
    name: 'Achilles Tan',
    meta: 'Local Guide · 125 reviews · 82 photos',
    date: '7 months ago',
    quote:
      'My new and favorite go to repair shop. Seldom can you find a shop where the owner is the one handling and overseeing the repair. You can really feel and sense his expertise and years of experience.\n\nHe charges fairly too, commensurate to the repairs that was done. So far all of my recent maintenance work and repairs have been done by Say auto care.\n\nIt also helps that their shop is so close to home.',
  },
  {
    name: 'James',
    meta: 'Local Guide · 13 reviews · 7 photos',
    date: 'a year ago',
    quote:
      'This is a great man who was very courteous and did everything I needed for my car.',
  },
] as const;

export function WebsiteHomePage({
  shellData,
}: {
  shellData: WebsiteShellData;
}) {
  const websiteLogoSrc = OFFICIAL_WEBSITE_LOGO_SRC;

  return (
    <div className="bg-[#030B18] text-white">
      <section
        id="home"
        className="relative isolate overflow-hidden border-b border-white/10"
      >
        <Image
          src={WEBSITE_HERO_BACKGROUND_SRC}
          alt="Premium SAY Auto Care workshop background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,24,0.96)_0%,rgba(3,11,24,0.86)_42%,rgba(3,11,24,0.58)_72%,rgba(3,11,24,0.4)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(215,25,32,0.16),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 xl:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div className="max-w-[620px]">
              <div className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/66">
                <span className="h-px w-10 bg-brand-red" />
                Your trusted auto care center
              </div>
              <h1 className="mt-6 font-display text-[2.9rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[4rem] lg:text-[5rem]">
                Driven By <span className="text-brand-red">Precision.</span>
                <br />
                Built On <span className="text-brand-red">Trust.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-base leading-8 text-white/76 sm:text-lg">
                Professional auto care services you can count on. Quality.
                Reliability. Performance.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="yellowPrimary"
                  size="pill"
                  className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/get-quote">
                    Service Quote
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineLight"
                  size="pill"
                  className="h-12 rounded-xl border-white/20 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/#services">
                    View Services
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {HERO_FEATURES.map(({ label, icon: Icon }) => (
                  <HeroFeature key={label} icon={Icon} label={label} />
                ))}
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      <section id="about-us" className="border-b border-white/10 bg-[#061224]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-center lg:px-8">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">
              About Us
            </p>
            <h2 className="text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
              Your trusted SAY Auto Care destination for dependable maintenance
              and repair.
            </h2>
            <p className="max-w-3xl text-base leading-8 text-white/72">
              SAY Auto Care delivers workshop support built around clear service
              communication, modern equipment, and a commitment to doing the job
              right. From diagnostics to preventive maintenance, the team is
              focused on safe, reliable results.
            </p>
            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.94),rgba(4,12,28,0.98))] px-5 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                USA-Certified Automotive Expertise
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
                SAY Auto Care is backed by hands-on automotive service expertise
                from an FCA-Certified Mechanic and USA Certified Mechanic, with
                experience involving FCA, Jeep, Dodge, RAM,
                Firestone/Bridgestone Complete Auto Care, and hybrid vehicle
                systems.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {EXPERTISE_HIGHLIGHTS.map((highlight) => (
                <ExpertiseHighlightCard
                  key={highlight.title}
                  highlight={highlight}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              asChild
              variant="yellowPrimary"
              size="pill"
              className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
            >
              <Link href="/get-quote">Service Quote</Link>
            </Button>
            <Button
              asChild
              variant="outlineLight"
              size="pill"
              className="h-12 rounded-xl border-white/16 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em]"
            >
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#030B18]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Our Services"
            title="How We Can Help"
            description="From diagnostics to major repairs, SAY Auto Care covers the services customers ask for most."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SERVICE_CARDS.map((service) => (
              <ServicePreviewCard key={service.title} service={service} />
            ))}
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/50">
                  Need parts too?
                </p>
                <p className="max-w-2xl text-base leading-7 text-white/76">
                  Browse tires, batteries, fluids, and other catalog items
                  online before you contact the shop for availability and
                  fitment.
                </p>
              </div>
              <Button
                asChild
                variant="outlineLight"
                size="pill"
                className="h-12 rounded-xl border-white/16 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/catalog">
                  Browse Catalog
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="brands"
        className="scroll-mt-28 bg-[#030B18] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-slate-50 px-4 py-10 shadow-[0_30px_70px_rgba(0,0,0,0.28)] sm:px-8 sm:py-12 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">
              <span className="h-px w-8 bg-brand-red" />
              Trusted Brands
              <span className="h-px w-8 bg-brand-red" />
            </p>
            <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.03em] text-[#061B3D] sm:text-4xl">
              Brands We Work With
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              We carry and work with trusted automotive brands for tires,
              batteries, suspension, 4x4 accessories, lubricants, and
              maintenance products.
            </p>
            <p className="mt-1.5 text-sm leading-7 text-slate-500">
              Availability may vary. Contact the shop for fitment, pricing, and
              current stock.
            </p>
          </div>

          <div className="mx-auto mt-7 flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-5 sm:mt-8 sm:gap-x-12 sm:gap-y-6 lg:gap-x-14 lg:gap-y-7">
            {BRAND_LOGOS.filter((brand) => brand.src.trim().length > 0).map(
              (brand) => (
                <BrandLogoTile key={brand.name} brand={brand} />
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="why-choose-us"
        className="border-y border-white/10 bg-[#061224]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:px-8 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07172d] shadow-[0_26px_60px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[16/11]">
              <Image
                src={WEBSITE_FEATURE_BACKGROUND_SRC}
                alt="SAY Auto Care workshop preview"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,11,24,0.12),rgba(3,11,24,0.48))]" />
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow="Why Choose Us"
              title="Quality Care You Can Trust"
              description="Backed by an FCA-Certified Mechanic and USA Certified Mechanic with hybrid vehicle service experience, SAY Auto Care combines hands-on expertise with honest service to keep your vehicle running at its best."
              align="left"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {TRUST_POINTS.map((point) => (
                <TrustPoint key={point.title} point={point} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-[#030B18]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Customer Reviews"
            title="What Our Customers Say"
            description="Real feedback from customers who visited SAY Auto Care Center / Mags & Tires."
          />
          <p className="mt-3 text-center text-sm leading-7 text-white/52">
            Reviews from Google.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {GOOGLE_REVIEW_PREVIEWS.map((review) => (
              <ReviewPreviewCard
                key={`${review.name}-${review.date}`}
                review={review}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              asChild
              variant="outlineLight"
              size="pill"
              className="h-12 rounded-xl border-white/16 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.16em]"
            >
              <Link
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View more reviews on Google
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] px-6 py-7 shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                  Ready to get started?
                </p>
                <h2 className="text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
                  Request a service quote and experience the SAY Auto Care
                  difference.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/72">
                  Reach the shop through the service quote form and let the team
                  guide you to the right next step for your vehicle.
                </p>
              </div>

              <Button
                asChild
                variant="yellowPrimary"
                size="pill"
                className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/get-quote">
                  Service Quote
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#030B18]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <BrandLogo
                src={websiteLogoSrc}
                alt={shellData.businessName}
                width={300}
                height={112}
                className="h-10 w-auto max-w-[150px] object-contain"
                surface="dark"
              />
              <div className="hidden h-10 w-px bg-white/10 sm:block" />
              <p className="max-w-xl text-sm leading-7 text-white/66">
                Need workshop support right away? Use the service quote form or
                contact the shop directly for assistance.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="outlineLight"
                size="pill"
                className="h-11 rounded-xl border-white/16 bg-transparent px-5 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button
                asChild
                variant="yellowPrimary"
                size="pill"
                className="h-11 rounded-xl px-5 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/get-quote">Service Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';

  return (
    <div
      className={
        centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl text-left'
      }
    >
      <div className={centered ? 'justify-center' : 'justify-start'}>
        <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">
          <span className="h-px w-8 bg-brand-red" />
          {eyebrow}
          <span className="h-px w-8 bg-brand-red" />
        </p>
      </div>
      <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-white/72">{description}</p>
    </div>
  );
}

function HeroFeature({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/90">
        {label}
      </p>
    </div>
  );
}

function ExpertiseHighlightCard({
  highlight,
}: {
  highlight: {
    title: string;
    description: string;
    icon: LucideIcon;
  };
}) {
  const Icon = highlight.icon;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-white">
        {highlight.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/66">
        {highlight.description}
      </p>
    </div>
  );
}

function BrandLogoTile({
  brand,
}: {
  brand: {
    name: string;
    src: string;
    frameClassName?: string;
  };
}) {
  return (
    <div className="flex h-16 w-[160px] items-center justify-center px-4 sm:h-[4.5rem] sm:w-[195px] sm:px-5 lg:h-20 lg:w-[220px] lg:px-6">
      <div
        className={cn(
          'relative h-14 w-full max-w-[210px]',
          brand.frameClassName,
        )}
      >
        <Image
          src={brand.src}
          alt={`${brand.name} logo`}
          fill
          sizes="(max-width: 639px) 160px, (max-width: 1023px) 190px, 240px"
          unoptimized={brand.src.endsWith('.svg')}
          className="object-contain"
        />
      </div>
    </div>
  );
}

function ServicePreviewCard({
  service,
}: {
  service: {
    title: string;
    description: string;
    icon: LucideIcon;
  };
}) {
  const Icon = service.icon;

  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(3,11,24,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <div className="absolute -right-10 top-0 h-24 w-24 rounded-full bg-brand-red/10 blur-3xl transition group-hover:bg-brand-red/18" />
      <div className="relative">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-brand-red/25 bg-brand-red/8 text-brand-red">
          <Icon className="size-7" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold leading-tight text-white">
          {service.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/68">
          {service.description}
        </p>
        <Link
          href="/get-quote"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:text-brand-red"
        >
          Learn More
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function TrustPoint({
  point,
}: {
  point: {
    title: string;
    description: string;
    icon: LucideIcon;
  };
}) {
  const Icon = point.icon;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-lg font-semibold text-white">{point.title}</p>
      <p className="mt-2 text-sm leading-7 text-white/68">
        {point.description}
      </p>
    </div>
  );
}

function ReviewPreviewCard({
  review,
}: {
  review: {
    name: string;
    meta: string;
    date: string;
    quote: string;
  };
}) {
  const initials = review.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.92),rgba(5,15,32,0.98))] p-6 shadow-[0_18px_46px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className="size-4 fill-current" />
        ))}
      </div>
      <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/76">
        {review.quote}
      </p>
      <div className="mt-6 flex items-start gap-4 border-t border-white/10 pt-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-sm font-semibold uppercase tracking-[0.14em] text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-white">{review.name}</p>
            <span className="text-xs uppercase tracking-[0.16em] text-white/38">
              Google Review
            </span>
          </div>
          <p className="mt-1 text-sm text-white/56">{review.meta}</p>
          <p className="mt-1 text-sm text-white/48">{review.date}</p>
        </div>
      </div>
    </div>
  );
}
