import Link from "next/link";

import { AppImage } from "@/components/shared/app-image";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WebsiteCatalogProduct } from "@/features/website/types";

export function WebsiteProductCard({
  product,
  compact = false,
}: {
  product: WebsiteCatalogProduct;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(4,12,28,0.98))] text-white shadow-[0_20px_56px_rgba(0,0,0,0.24)]">
      <div className="relative">
        {product.imageUrl ? (
          <AppImage
            src={product.imageUrl}
            alt={product.name}
            width={800}
            height={640}
            mode="content"
            fit="cover"
            className={`w-full ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}
          />
        ) : (
          <div
            className={`flex items-end bg-[linear-gradient(135deg,_#0b2144_0%,_#07172d_60%,_#030b18_100%)] p-5 text-white ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/54">
                SAY Auto Care
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight">
                {product.productType}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {product.categoryName ?? "Workshop-ready item"}
              </p>
            </div>
          </div>
        )}

        {product.badge ? (
          <Badge className="absolute left-4 top-4 border border-brand-red/30 bg-brand-red text-white shadow-[0_12px_26px_rgba(214,40,40,0.28)]">
            {product.badge}
          </Badge>
        ) : null}
      </div>

      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
            {product.brandName ?? product.categoryName ?? "Catalog item"}
          </p>
          <h3 className="text-xl font-semibold leading-tight text-white sm:text-[1.35rem]">
            {product.name}
          </h3>
          <p className="text-sm leading-6 text-white/68">
            {product.shortDescription ?? product.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
              In-store item
            </p>
            <p className="text-xl font-semibold text-brand-red sm:text-2xl">
              Check Availability
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/46">
              {product.unitLabel}
            </p>
          </div>

          <Link
            href={`/catalog/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-red/40 hover:bg-brand-red hover:text-white"
          >
            View product
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
