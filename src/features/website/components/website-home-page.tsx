import Link from "next/link";

import { DEFAULT_BRAND_LOGO_SRC } from "@/components/shared/brand-assets";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  BatteryCharging,
  ClipboardList,
  Gauge,
  PhoneCall,
  ShieldCheck,
  type LucideIcon,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CTASection } from "@/features/website/components/cta-section";
import { HeroSection } from "@/features/website/components/hero-section";
import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { ServiceCard } from "@/features/website/components/service-card";
import { WebsiteProductCard } from "@/features/website/components/website-product-card";
import { WebsiteStoryCard } from "@/features/website/components/website-story-card";
import {
  listFeaturedWebsiteProducts,
  listPublishedWebsitePosts,
} from "@/features/website/queries/website-queries";
import type { WebsiteShellData } from "@/features/website/types";

const FEATURE_BLOCKS = [
  {
    eyebrow: "Top category",
    title: "Tires & wheel packages",
    description:
      "From everyday replacements to upgrade-ready sets, make tire choices easier to browse before customers ask for pricing.",
    icon: Gauge,
    href: "/catalog?search=tire",
    cta: "Browse tires",
  },
  {
    eyebrow: "Maintenance",
    title: "Oils, fluids, and consumables",
    description:
      "Highlight oils, brake fluids, coolants, and other maintenance essentials customers often need during routine service.",
    icon: Wrench,
    href: "/catalog?type=fluid",
    cta: "See fluids",
  },
  {
    eyebrow: "Fast-moving item",
    title: "Batteries and electrical essentials",
    description:
      "Keep batteries and electrical essentials visible for customers who need immediate replacement or a fast availability check.",
    icon: BatteryCharging,
    href: "/catalog?search=battery",
    cta: "Shop batteries",
  },
] as const;

const PROCESS_STEPS = [
  {
    step: "1",
    title: "Browse",
    description:
      "Explore tires, fluids, batteries, and other automotive items in a clean, easy-to-scan catalog.",
  },
  {
    step: "2",
    title: "Request service",
    description:
      "Use the service form when you need maintenance, repair, diagnostics, or other workshop work.",
  },
  {
    step: "3",
    title: "Call or visit",
    description:
      "For catalog items, call or visit the shop directly to confirm availability, fitment, or installation.",
  },
] as const;

const HERO_POINTS = [
  {
    title: "Tires",
    description: "Featured brands and fitment-friendly options.",
  },
  {
    title: "Service",
    description: "Dedicated form for workshop inquiries and estimates.",
  },
  {
    title: "Updates",
    description: "Shop work, promos, and maintenance tips.",
  },
] as const;

export async function WebsiteHomePage({
  shellData,
}: {
  shellData: WebsiteShellData;
}) {
  const [featuredProducts, latestPosts] = await Promise.all([
    listFeaturedWebsiteProducts(6),
    listPublishedWebsitePosts(3),
  ]);

  return (
    <div className="bg-[#f3f5fa]">
      <HeroSection
        eyebrow="SAY Auto Care Center"
        title="TIRES, TRUSTED PARTS, AND STRAIGHTFORWARD AUTO CARE SUPPORT."
        description="A cleaner, stronger public website for showcasing products, collecting service quote requests, and sharing real shop updates with a clear automotive service feel."
        actions={
          <>
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/get-quote">Service Quote</Link>
            </Button>
            <Button asChild variant="outlineLight" size="pill">
              <Link href="/catalog">Browse Products</Link>
            </Button>
          </>
        }
        aside={
          <div className="space-y-5">
            <div className="flex justify-center px-2 pt-1 sm:px-4">
              <BrandLogo
                src={shellData.businessLogoUrl ?? DEFAULT_BRAND_LOGO_SRC}
                alt={shellData.businessName}
                width={420}
                height={360}
                className="h-auto w-full max-w-[360px]"
                priority
              />
            </div>
            <div className="rounded-2xl bg-[#f3f5fa] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#173c99]">
                Pinoy craftsmanship
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#10224d]">
                American precision.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#4d5f7f]">
                Strong blue sections, clearer product presentation, and faster service inquiry actions
                give the website a more intentional service-brand presence.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <HeroAsideChip title="Catalog-led" description="Products first, not filler copy." />
              <HeroAsideChip title="Brand-led" description="Blue and yellow used intentionally." />
              <HeroAsideChip title="Service-ready" description="Workshop quote stays separate from product browsing." />
            </div>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {HERO_POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-white/12 bg-white/10 p-4 shadow-[0_16px_34px_rgba(4,12,38,0.16)] backdrop-blur"
            >
              <p className="text-base font-semibold text-white">
                {point.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#d8e3ff]">{point.description}</p>
            </div>
          ))}
        </div>
      </HeroSection>

      <SectionContainer tone="navy" spacing="compact" className="pt-0">
        <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-7 shadow-[0_24px_50px_rgba(5,14,44,0.24)] backdrop-blur sm:px-7 sm:py-8">
          <PageHeader
            eyebrow="Main website focus"
            title="SHOWCASE THE PRODUCTS CUSTOMERS ASK ABOUT FIRST."
            description="The reference design stays simple, but it separates sections clearly and gives the important categories stronger visual presence. This block does the same."
            align="center"
            inverse
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {FEATURE_BLOCKS.map((block) => (
              <ServiceCard
                key={block.title}
                icon={block.icon}
                eyebrow={block.eyebrow}
                title={block.title}
                description={block.description}
                href={block.href}
                cta={block.cta}
              />
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer tone="muted" width="default">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <PageHeader
            eyebrow="How it works"
            title="A clear path from browsing to the right next step."
            description="Products stay browse-first, while service work has its own request path. That makes the website easier to understand and more realistic for an in-store shop."
            align="left"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl bg-white p-5 shadow-[0_18px_36px_rgba(7,18,57,0.1)] ring-1 ring-[#dbe3f5] sm:p-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffd24a] font-semibold text-[#10224d]">
                  {step.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-tight text-[#10224d]">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#4d5f7f]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer tone="white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow="Featured products"
            title="TIRES, FLUIDS, BATTERIES, AND EVERYDAY AUTO CARE ITEMS."
            description="Featured cards should feel curated and valuable, not like a generic list. These product cards now carry more brand weight while staying easy to scan."
            align="left"
          />
          <Button asChild variant="outlineBlue" size="pill">
            <Link href="/catalog">View full catalog</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2dbef] bg-[#f8faff] p-8 text-sm leading-7 text-[#5b6783]">
              Publish featured products to start building this section.
            </div>
          ) : (
            featuredProducts.map((product) => (
              <WebsiteProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </SectionContainer>

      <SectionContainer tone="navy">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow="Shop updates and tips"
            title="REAL WORK, PROMOS, AND PRACTICAL MAINTENANCE ADVICE."
            description="This keeps the owner’s social-style posting habit but presents it inside a more polished website section with stronger contrast and better grouping."
            align="left"
            inverse
          />
          <Button asChild variant="yellowPrimary" size="pill">
            <Link href="/garage-journal">Open journal</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {latestPosts.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-sm leading-7 text-[#5b6783] shadow-[0_22px_48px_rgba(7,18,57,0.18)]">
              Add shop updates or maintenance tips to publish them here.
            </div>
          ) : (
            latestPosts.map((post) => <WebsiteStoryCard key={post.id} post={post} />)
          )}
        </div>
      </SectionContainer>

      <CTASection
        eyebrow="Need service help?"
        title="LET CUSTOMERS SEND THE SERVICE DETAILS YOU NEED THE FIRST TIME."
        description="Keep product browsing simple, and use the structured form for maintenance, repairs, inspections, and other workshop concerns."
        actions={
          <>
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/get-quote">Service Quote</Link>
            </Button>
            <Button asChild variant="outlineLight" size="pill">
              <Link href="/contact">Contact the shop</Link>
            </Button>
          </>
        }
        aside={
          <div className="grid gap-4 md:grid-cols-3">
            <CTANote
              icon={ClipboardList}
              title="Vehicle details"
              description="Capture the make, model, service need, and customer concern in one go."
            />
            <CTANote
              icon={ShieldCheck}
              title="In-store product shopping"
              description="Use the catalog for pricing, then call or visit the shop for availability, fitment, or install advice."
            />
            <CTANote
              icon={PhoneCall}
              title="Direct follow-up"
              description="Keep a clear phone contact path visible for customers who prefer to call."
            />
          </div>
        }
      />
    </div>
  );
}

function HeroAsideChip({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dbe3f5] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(7,18,57,0.08)]">
      <p className="text-sm font-semibold text-[#10224d]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#4d5f7f]">{description}</p>
    </div>
  );
}

function CTANote({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd24a] text-[#10224d]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#d8e3ff]">{description}</p>
    </div>
  );
}
