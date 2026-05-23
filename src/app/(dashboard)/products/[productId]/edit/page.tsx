import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/features/products/components/product-form";
import { mapProductRowToFormValues } from "@/features/products/mappers";
import {
  getEditableProductById,
  getProductFormOptions,
} from "@/features/products/queries/product-queries";
import { resolveProductImageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const [product, options] = await Promise.all([
    getEditableProductById(productId),
    getProductFormOptions(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update product catalog data without confusing it with live inventory quantities."
      />
      <ProductForm
        mode="edit"
        categories={options.categories}
        brands={options.brands}
        suppliers={options.suppliers}
        units={options.units}
        branches={options.branches}
        permissions={options.permissions}
        initialValues={mapProductRowToFormValues(product)}
        initialImagePreviewUrl={resolveProductImageUrl({
          productImagePath: product.product_image_path,
          productImageUrl: product.product_image_url,
          websiteImageUrl: product.website_image_url,
          cacheBust: product.updated_at,
        })}
      />
    </div>
  );
}
