import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/features/products/components/product-form";
import { mapProductRowToFormValues } from "@/features/products/mappers";
import { getProductFormOptions, getProductById } from "@/features/products/queries/product-queries";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const [product, options] = await Promise.all([getProductById(productId), getProductFormOptions()]);

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
        initialValues={mapProductRowToFormValues(product)}
      />
    </div>
  );
}
