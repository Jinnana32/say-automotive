import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/features/products/components/product-form";
import { getProductFormOptions } from "@/features/products/queries/product-queries";
import { formatMoneyInputValue } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const options = await getProductFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product"
        description="Create product master data first. Stock balances and movement history are handled separately."
      />
      <ProductForm
        mode="create"
        categories={options.categories}
        brands={options.brands}
        suppliers={options.suppliers}
        units={options.units}
        initialValues={{
          name: "",
          sku: "",
          barcode: "",
          categoryId: "",
          brandId: "",
          supplierId: "",
          unitId: "",
          partNumber: "",
          oemNumber: "",
          description: "",
          productType: "part",
          costPrice: formatMoneyInputValue(0),
          sellingPrice: formatMoneyInputValue(0),
          reorderLevel: "0",
          warrantyDurationDays: "",
          shelfLocation: "",
          websiteVisible: false,
          websiteFeatured: false,
          websiteSortOrder: "0",
          websiteSlug: "",
          productImageUrl: "",
          websiteImageUrl: "",
          websiteShortDescription: "",
          websiteBadge: "",
          status: "active",
        }}
      />
    </div>
  );
}
