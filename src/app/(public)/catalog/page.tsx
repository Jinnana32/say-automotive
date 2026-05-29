import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  BatteryCharging,
  Gauge,
  PhoneCall,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WebsiteProductCard } from "@/features/website/components/website-product-card";
import {
  getWebsiteShellData,
  listWebsiteCatalogProducts,
} from "@/features/website/queries/website-queries";
import type { ProductType } from "@/features/products/types";

export const dynamic = "force-dynamic";

const WEBSITE_HERO_BACKGROUND_SRC = "/brand/website-feature-background.png";

const CATALOG_GROUPS = [
  {
    eyebrow: "Popular request",
    title: "Tires and wheel-ready options",
    description:
      "Start with tires and wheel-related product inquiries that customers usually ask about first.",
    icon: Gauge,
    href: "/catalog?search=tire",
    cta: "Browse tires",
  },
  {
    eyebrow: "Routine maintenance",
    title: "Oils, fluids, and consumables",
    description:
      "Keep maintenance products easy to scan so customers can check the basics before contacting the shop.",
    icon: Wrench,
    href: "/catalog?type=fluid",
    cta: "See fluids",
  },
  {
    eyebrow: "Fast-moving item",
    title: "Batteries and electrical items",
    description:
      "Make urgent replacement items easy to find for customers who need a fast availability answer.",
    icon: BatteryCharging,
    href: "/catalog?search=battery",
    cta: "Shop batteries",
  },
] as const;

type CatalogPageProps = {
  searchParams: Promise<{
    search?: string;
    type?: ProductType | "";
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { search = "", type = "" } = await searchParams;
  const [products, shellData] = await Promise.all([
    listWebsiteCatalogProducts({ search, productType: type }),
    getWebsiteShellData(),
  ]);
  const hasSingleProduct = products.length === 1;

  return (
    <div className="bg-[#030B18] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src={WEBSITE_HERO_BACKGROUND_SRC}
          alt="SAY Auto Care catalog background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,24,0.94)_0%,rgba(3,11,24,0.82)_45%,rgba(3,11,24,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(215,25,32,0.18),transparent_26%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/66">
                <span className="h-px w-10 bg-brand-red" />
                Product Catalog
              </div>
              <h1 className="mt-6 font-display text-[2.9rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[3.7rem] lg:text-[4.6rem]">
                Tires, Fluids,
                <br />
                <span className="text-brand-red">Batteries, and More.</span>
              </h1>
              <p className="mt-5 max-w-[620px] text-base leading-8 text-white/76 sm:text-lg">
                Browse workshop essentials from SAY Auto Care, then contact the shop for
                availability, fitment, and in-store assistance.
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
                  className="h-12 rounded-xl border-white/18 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/contact">
                    Contact the shop
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                Catalog Notes
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                This catalog is for browsing, availability checks, and product-focused inquiries.
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/70">
                <p>
                  The product listing helps customers ask better questions before they call or
                  visit the branch.
                </p>
                <p>
                  Final pricing, compatibility, and fitment should still be confirmed directly with
                  the shop.
                </p>
                {shellData.contactNumber ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <PhoneCall className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <div>
                      <p className="font-semibold text-white">Quick availability check</p>
                      <p className="mt-1">{shellData.contactNumber}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.94),rgba(4,12,28,0.98))] p-5 shadow-[0_22px_56px_rgba(0,0,0,0.24)] sm:p-6">
            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/38" />
                <input
                  type="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Search tires, batteries, oils, or accessories"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/6 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-brand-red/70 focus:ring-2 focus:ring-brand-red/20"
                />
              </label>
              <select
                name="type"
                defaultValue={type}
                className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none transition focus:border-brand-red/70 focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="" className="text-slate-900">
                  All types
                </option>
                <option value="part" className="text-slate-900">
                  Part
                </option>
                <option value="fluid" className="text-slate-900">
                  Fluid
                </option>
                <option value="consumable" className="text-slate-900">
                  Consumable
                </option>
                <option value="accessory" className="text-slate-900">
                  Accessory
                </option>
                <option value="tool" className="text-slate-900">
                  Tool
                </option>
              </select>
              <Button type="submit" variant="yellowPrimary" size="pill" className="h-12 rounded-xl">
                Apply
              </Button>
              <Button
                asChild
                variant="outlineLight"
                size="pill"
                className="h-12 rounded-xl border-white/16 bg-transparent"
              >
                <Link href="/catalog">Reset</Link>
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-[#030B18]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Browse By Focus"
            title="Start With the Product Groups Customers Ask About Most."
            description="Keep the most common catalog questions easy to reach, then contact the shop for fitment and availability guidance."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {CATALOG_GROUPS.map((group) => (
              <CatalogFocusCard key={group.title} {...group} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Published Items"
              title="Currently Highlighted Products."
              description="Browse published products and contact the shop for availability, fitment, and product-related assistance."
              align="left"
            />
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/52">
              <Sparkles className="size-4 text-brand-red" />
              {products.length} item{products.length === 1 ? "" : "s"} shown
            </p>
          </div>

          <div className="mt-10">
            {products.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/14 bg-white/[0.04] p-10 text-sm leading-7 text-white/68">
                No published website items match this filter yet.
              </div>
            ) : hasSingleProduct ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(320px,430px)_minmax(0,1fr)] xl:items-stretch">
                <WebsiteProductCard product={products[0]} />
                <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.98))] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.24)] sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                    Featured Product
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold leading-tight text-white">
                    Need more detail about this item?
                  </h3>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                    Contact the shop for availability, fitment, and installation guidance while
                    this featured product is on display.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <FeatureMiniCard
                      title="Ask about stock"
                      description="Confirm current availability before visiting the shop."
                    />
                    <FeatureMiniCard
                      title="Check fitment"
                      description="Ask the team if this item fits your vehicle or service need."
                    />
                    <FeatureMiniCard
                      title="Plan installation"
                      description="Get guidance on installation or the next best step for your vehicle."
                    />
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      variant="yellowPrimary"
                      size="pill"
                      className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                    >
                      <Link href="/contact">Contact the shop</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outlineLight"
                      size="pill"
                      className="h-12 rounded-xl border-white/16 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                    >
                      <Link href="/get-quote">Service Quote</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <WebsiteProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#030B18]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] px-6 py-7 shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                  Need service work too?
                </p>
                <h2 className="text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
                  Keep product browsing simple, and use the service form for workshop requests.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/72">
                  For product availability, fitment, and current pricing, call or visit the shop.
                  For maintenance, repairs, inspections, or workshop concerns, use the service
                  quote form.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="outlineLight"
                  size="pill"
                  className="h-12 rounded-xl border-white/16 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/contact">Contact the shop</Link>
                </Button>
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
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left"}>
      <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">
        <span className="h-px w-8 bg-brand-red" />
        {eyebrow}
        <span className="h-px w-8 bg-brand-red" />
      </p>
      <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-white/72">{description}</p>
    </div>
  );
}

function CatalogFocusCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Gauge;
  href: string;
  cta: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(4,12,28,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <div className="absolute -right-10 top-0 h-24 w-24 rounded-full bg-brand-red/10 blur-3xl transition group-hover:bg-brand-red/18" />
      <div className="relative">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-brand-red/25 bg-brand-red/8 text-brand-red">
          <Icon className="size-7" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/48">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/68">{description}</p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:text-brand-red"
        >
          {cta}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function FeatureMiniCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/66">{description}</p>
    </div>
  );
}
