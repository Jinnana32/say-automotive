import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { formatCurrency } from "@/lib/currency";
import { listProducts } from "@/features/products/queries/product-queries";
import { ProductImage } from "@/features/products/components/product-image";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { search = "", page } = await searchParams;
  const products = await listProducts(search);
  const pagination = paginateItems(products, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Catalog records used by inventory, job orders, and POS."
        actions={
          <Button asChild>
            <Link href="/products/new">New product</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Product catalog"
        description={`${pagination.totalItems} product${pagination.totalItems === 1 ? "" : "s"} matched.`}
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: "Search name, SKU, barcode, or part number",
            }}
          />
        }
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
          />
        }
      >

        {pagination.totalItems === 0 ? (
          <EmptyState
            title="No products found"
            description="Create product catalog records before stock is received, used, or sold."
            action={
              <Button asChild>
                <Link href="/products/new">Create product</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Reorder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={product.productImageUrl}
                          alt={product.name}
                          className="size-14 shrink-0"
                          fallbackLabel="Photo"
                        />
                        <div className="space-y-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.categoryName ?? "Uncategorized"} · {product.unitLabel}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.productType}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {product.websiteVisible ? (
                          <StatusBadge tone={product.websiteFeatured ? "info" : "success"}>
                            {product.websiteFeatured ? "Featured" : "Published"}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Hidden</StatusBadge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {product.websiteSlug ?? "Slug auto-generated when published"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{product.supplierName ?? "No supplier"}</TableCell>
                    <TableCell>
                      <div>{formatCurrency(product.sellingPrice)}</div>
                      <div className="text-sm text-muted-foreground">
                        Cost {formatCurrency(product.costPrice)}
                      </div>
                    </TableCell>
                    <TableCell>{product.reorderLevel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={product.status === "active" ? "success" : "neutral"}>
                        {product.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TableRowActionsMenu label={`Product actions for ${product.name}`}>
                        <TableRowActionsMenuLink
                          href={`/products/${product.id}/edit`}
                          label="Edit product"
                        />
                      </TableRowActionsMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
