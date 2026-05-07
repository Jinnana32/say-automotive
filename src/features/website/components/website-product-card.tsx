/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import type { WebsiteCatalogProduct } from "@/features/website/types";
import { formatCurrency } from "@/lib/currency";

export function WebsiteProductCard({
  product,
  compact = false,
}: {
  product: WebsiteCatalogProduct;
  compact?: boolean;
}) {
  return (
    <Card className={websiteCardVariants({ variant: "product" })}>
      <div className="relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full object-cover ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}
          />
        ) : (
          <div
            className={`flex items-end bg-[linear-gradient(135deg,_#15398f_0%,_#0f215f_100%)] p-5 text-white ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffe7a5]">
                SAY Auto Care
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight">
                {product.productType}
              </p>
              <p className="mt-1 text-sm text-[#dbe3ff]">
                {product.categoryName ?? "Workshop-ready item"}
              </p>
            </div>
          </div>
        )}

        {product.badge ? (
          <Badge className="absolute left-4 top-4 border-transparent bg-[#ffd24a] text-[#10224d] shadow-[0_10px_24px_rgba(255,210,74,0.24)]">
            {product.badge}
          </Badge>
        ) : null}
      </div>

      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#173c99]">
            {product.brandName ?? product.categoryName ?? "Catalog item"}
          </p>
          <h3 className="text-xl font-semibold leading-tight text-[#10224d] sm:text-[1.35rem]">
            {product.name}
          </h3>
          <p className="text-sm leading-6 text-[#4d5f7f]">
            {product.shortDescription ??
              product.description ??
              "Featured automotive product from SAY Auto Care."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-[#e7edf8] pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7ca2]">
              Starting at
            </p>
            <p className="text-xl font-semibold text-[#102b84] sm:text-2xl">
              {formatCurrency(product.price)}
            </p>
          </div>

          <Link
            href={`/catalog/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#ffd24a] px-4 py-2 text-sm font-semibold text-[#10224d] transition hover:bg-[#ffdc72]"
          >
            View product
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
