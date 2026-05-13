import Link from "next/link";

import { BatteryCharging, Gauge, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CTASection } from "@/features/website/components/cta-section";
import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { ServiceCard } from "@/features/website/components/service-card";
import { WebsiteProductCard } from "@/features/website/components/website-product-card";
import { listWebsiteCatalogProducts } from "@/features/website/queries/website-queries";
import type { ProductType } from "@/features/products/types";

export const dynamic = "force-dynamic";

const CATALOG_GROUPS = [
  {
    eyebrow: "Popular request",
    title: "Tires and wheel-ready options",
    description:
      "Lead with the most asked-about products so customers can get to pricing and fitment questions faster.",
    icon: Gauge,
    href: "/catalog?search=tire",
    cta: "Browse tires",
  },
  {
    eyebrow: "Routine maintenance",
    title: "Oils, fluids, and consumables",
    description:
      "Show service-related items in one place so maintenance shoppers are not forced to dig through generic listings.",
    icon: Wrench,
    href: "/catalog?type=fluid",
    cta: "See fluids",
  },
  {
    eyebrow: "Fast-moving item",
    title: "Batteries and electrical items",
    description:
      "Keep urgent replacement items visible for customers who usually need a quick answer and a fast availability check.",
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
  const products = await listWebsiteCatalogProducts({ search, productType: type });
  const hasSingleProduct = products.length === 1;

  return (
    <div className="bg-[#f3f5fa]">
      <SectionContainer tone="navy" spacing="hero" className="pb-24">
        <PageHeader
          eyebrow="Catalog"
          title="TIRES, FLUIDS, BATTERIES, AND WORKSHOP ESSENTIALS."
          description="The catalog should feel like a real automotive storefront, with strong brand contrast, clear filters, and obvious ways to contact or visit the shop for availability and fitment."
          inverse
          titleTag="h1"
          size="hero"
          actions={
            <>
              <Button asChild variant="yellowPrimary" size="pill">
                <Link href="/contact">Contact the shop</Link>
              </Button>
              <Button asChild variant="outlineLight" size="pill">
                <Link href="/get-quote">Service quote</Link>
              </Button>
            </>
          }
        />
      </SectionContainer>

      <SectionContainer tone="muted" spacing="compact" className="-mt-12 pt-0">
        <div className="rounded-2xl bg-white p-5 shadow-[0_22px_44px_rgba(7,18,57,0.12)] ring-1 ring-[#dbe3f5] sm:p-6">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search tires, batteries, oils, or accessories"
              className="h-12 rounded-2xl border border-[#d6deef] bg-white px-4 text-sm text-[#10224d] outline-none transition focus:border-[#173c99] focus:ring-2 focus:ring-[#173c99]/15"
            />
            <select
              name="type"
              defaultValue={type}
              className="h-12 rounded-2xl border border-[#d6deef] bg-white px-4 text-sm text-[#10224d] outline-none transition focus:border-[#173c99] focus:ring-2 focus:ring-[#173c99]/15"
            >
              <option value="">All types</option>
              <option value="part">Part</option>
              <option value="fluid">Fluid</option>
              <option value="consumable">Consumable</option>
              <option value="accessory">Accessory</option>
              <option value="tool">Tool</option>
            </select>
            <Button type="submit" variant="bluePrimary" size="pill" className="h-12">
              Apply
            </Button>
            <Button asChild variant="outlineBlue" size="pill" className="h-12">
              <Link href="/catalog">Reset</Link>
            </Button>
          </form>
        </div>

        <div className="mt-10">
          <PageHeader
            eyebrow="Browse by focus"
            title="START WITH THE CATEGORIES CUSTOMERS ASK ABOUT MOST."
            description="The reference site uses clear grouped blocks below the hero. This gives the catalog the same kind of visual entry points before people dive into the product grid or contact the shop."
            align="left"
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {CATALOG_GROUPS.map((group) => (
              <ServiceCard
                key={group.title}
                icon={group.icon}
                eyebrow={group.eyebrow}
                title={group.title}
                description={group.description}
                href={group.href}
                cta={group.cta}
              />
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer tone="white" className="pt-0">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow="Published items"
            title="CURRENTLY HIGHLIGHTED PRODUCTS."
            description="The product grid should feel substantial and curated, not like plain boxes on a blank page. Customers can browse what the shop carries and then contact the branch for availability, fitment, or next-step advice."
            align="left"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#173c99]">
            {products.length} item{products.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <div className="mt-8">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2dbef] bg-[#f8faff] p-10 text-sm leading-7 text-[#5b6783]">
              No published website items match this filter yet.
            </div>
          ) : hasSingleProduct ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(320px,430px)_minmax(0,1fr)] lg:items-stretch">
              <WebsiteProductCard product={products[0]} />
              <div className="rounded-2xl bg-[linear-gradient(135deg,#0d245f_0%,#173c99_100%)] p-6 text-white shadow-[0_22px_44px_rgba(7,18,57,0.16)] sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd24a]">
                  Featured product
                </p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">
                  A single catalog item should still feel properly merchandised.
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d8e3ff]">
                  When the catalog only has one published item, the layout now supports it with a
                  branded information panel instead of leaving a large empty grid area. Keep the
                  product visible and route questions toward contact or an in-store visit.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm font-semibold text-white">Published product</p>
                    <p className="mt-1 text-sm leading-6 text-[#d8e3ff]">
                      Even one active catalog item can anchor the section cleanly.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm font-semibold text-white">In-store buying</p>
                    <p className="mt-1 text-sm leading-6 text-[#d8e3ff]">
                      Customers can call or visit the branch for availability and final confirmation.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm font-semibold text-white">Shop guidance</p>
                    <p className="mt-1 text-sm leading-6 text-[#d8e3ff]">
                      The shop can advise on fitment, compatibility, or installation before purchase.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="yellowPrimary" size="pill">
                    <Link href="/contact">Contact the shop</Link>
                  </Button>
                  <Button asChild variant="outlineLight" size="pill">
                    <Link href="/get-quote">Service quote</Link>
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
      </SectionContainer>

      <CTASection
        eyebrow="Need service work too?"
        title="KEEP PRODUCT BROWSING SIMPLE, AND USE THE SERVICE FORM ONLY FOR WORKSHOP REQUESTS."
        description="For product availability, fitment, and current pricing, call or visit the shop. For maintenance, repairs, inspections, or workshop concerns, use the service quote form."
        actions={
          <>
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/contact">Contact the shop</Link>
            </Button>
            <Button asChild variant="outlineLight" size="pill">
              <Link href="/get-quote">Service quote</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
