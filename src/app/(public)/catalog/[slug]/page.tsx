import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, ArrowRight, PhoneCall } from "lucide-react";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { WebsiteProductCard } from "@/features/website/components/website-product-card";
import {
  getWebsiteProductBySlug,
  listFeaturedWebsiteProducts,
} from "@/features/website/queries/website-queries";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getWebsiteProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await listFeaturedWebsiteProducts(3)).filter(
    (item) => item.slug !== product.slug,
  );

  return (
    <div className="bg-[#030B18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/58 transition hover:text-brand-red"
          >
            <ArrowLeft className="size-4" />
            Back to catalog
          </Link>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-red">
              {product.brandName ?? product.categoryName ?? "Catalog item"}
            </p>
            <h1 className="font-display text-[2.8rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[3.6rem]">
              {product.name}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-white/72">
              {product.shortDescription ?? product.description ?? "Website-published product."}
            </p>
          </div>
        </div>

        <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] xl:items-start">
          <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(4,12,28,0.98))] shadow-[0_22px_56px_rgba(0,0,0,0.24)]">
            {product.imageUrl ? (
              <AppImage
                src={product.imageUrl}
                alt={product.name}
                width={1400}
                height={1120}
                mode="content"
                fit="cover"
                className="aspect-[5/4] w-full"
              />
            ) : (
              <div className="flex aspect-[5/4] items-end bg-[linear-gradient(135deg,_#0b2144_0%,_#07172d_60%,_#030b18_100%)] p-8 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/52">
                    SAY Auto Care catalog
                  </p>
                  <h2 className="mt-4 font-display text-5xl uppercase leading-none tracking-[0.03em] text-white sm:text-6xl">
                    {product.productType}
                  </h2>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(4,12,28,0.98))] p-6 shadow-[0_22px_56px_rgba(0,0,0,0.24)] sm:p-7">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                Availability and fitment
              </p>
              <p className="mt-2 text-3xl font-semibold text-brand-red">
                Call or visit the shop
              </p>
              <p className="mt-2 text-sm text-white/72">
                {product.categoryName ?? product.productType} · {product.unitLabel}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/68">
                The team can confirm stock, compatibility, and current in-store pricing before you
                visit the branch.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 size-4 shrink-0 text-brand-red" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">In-store browsing only</p>
                  <p className="text-sm leading-7 text-white/68">
                    This catalog helps customers ask better questions. Final stock, pricing,
                    fitment, and installation guidance should still be confirmed directly with the
                    shop.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="yellowPrimary"
                size="pill"
                className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/contact">Contact the shop about this item</Link>
              </Button>
              <Button
                asChild
                variant="outlineLight"
                size="pill"
                className="h-12 rounded-xl border-white/16 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em]"
              >
                <Link href="/get-quote">
                  Service Quote
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-16 space-y-6 border-t border-white/10 pt-16">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-red">
                More featured items
              </p>
              <h2 className="font-display text-4xl uppercase tracking-[0.03em] text-white">
                Other products worth checking
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((item) => (
                <WebsiteProductCard key={item.id} product={item} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
