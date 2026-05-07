/* eslint-disable @next/next/no-img-element */

import { notFound } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import {
  getWebsiteProductBySlug,
  listFeaturedWebsiteProducts,
} from "@/features/website/queries/website-queries";
import { WebsiteProductCard } from "@/features/website/components/website-product-card";

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
    <div className="container space-y-10 py-12">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-start">
        <div className="overflow-hidden rounded-[28px] border border-[#d9e1f2] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="aspect-[5/4] w-full object-cover" />
          ) : (
            <div className="flex aspect-[5/4] items-end bg-[linear-gradient(135deg,_#1937a6_0%,_#0f215f_100%)] p-8 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd1d7]">
                  SAY Auto Care catalog
                </p>
                <h1 className="mt-4 font-display text-6xl uppercase leading-none tracking-[0.03em]">
                  {product.productType}
                </h1>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-[28px] border border-[#d9e1f2] bg-white p-8 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e11d2f]">
              {product.brandName ?? product.categoryName ?? "Catalog item"}
            </p>
            <h1 className="font-display text-5xl uppercase leading-none tracking-[0.03em] text-[#1937a6]">
              {product.name}
            </h1>
            <p className="text-sm leading-7 text-[#5c6a8a]">
              {product.shortDescription ?? product.description ?? "Website-published product."}
            </p>
          </div>

          <div className="rounded-[20px] bg-[#f8faff] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7181a7]">
              Starting at
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#1937a6]">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-2 text-sm text-[#5c6a8a]">
              {product.categoryName ?? product.productType} · {product.unitLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/contact">Contact the shop about this item</Link>
            </Button>
            <Button asChild variant="outlineBlue" size="pill">
              <Link href="/catalog">Back to catalog</Link>
            </Button>
          </div>

          <div className="rounded-[20px] border border-dashed border-[#d2dbef] p-5 text-sm leading-6 text-[#5c6a8a]">
            This catalog is for in-store browsing only. For availability, fitment, compatibility,
            or installation questions, call or visit the shop directly.
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e11d2f]">
              More featured items
            </p>
            <h2 className="font-display text-4xl uppercase tracking-[0.03em] text-[#1937a6]">
              Other products worth checking
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((item) => (
              <WebsiteProductCard key={item.id} product={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
