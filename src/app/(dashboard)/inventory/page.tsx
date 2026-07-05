import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryMovementDialog } from "@/features/inventory/components/inventory-movement-dialog";
import { InventoryStockRowActions } from "@/features/inventory/components/inventory-stock-row-actions";
import { InventorySettingsDialog } from "@/features/inventory/components/inventory-settings-dialog";
import {
  InventoryMovementTypeBadge,
  InventoryStockStatusBadge,
} from "@/features/inventory/components/inventory-status-badge";
import { getInventoryDashboardData } from "@/features/inventory/queries/inventory-queries";
import type {
  InventoryMovementType,
  InventoryStockFilterState,
} from "@/features/inventory/types";
import {
  formatInventoryMovementType,
  formatInventoryQuantity,
} from "@/features/inventory/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams: Promise<{
    search?: string;
    stockState?: InventoryStockFilterState;
    movementType?: InventoryMovementType;
    stockPage?: string;
    movementPage?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const {
    search = "",
    stockState = "all",
    movementType = "",
    stockPage,
    movementPage,
  } = await searchParams;
  const inventory = await getInventoryDashboardData({
    search,
    stockState,
    movementType,
  });
  const stockPagination = paginateItems(inventory.stocks, stockPage);
  const movementPagination = paginateItems(inventory.movements, movementPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock administration, stock health, and the movement ledger."
        actions={
          <>
            <InventoryMovementDialog
              products={inventory.productOptions}
              canCreateProducts={inventory.permissions.canCreateProducts}
            />
            <InventorySettingsDialog products={inventory.productOptions} />
            <Button asChild variant="outline">
              <Link href="/products">Review products</Link>
            </Button>
          </>
        }
      />

      <MetricGrid className="grid-cols-2 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Branch" value={inventory.branchName} description="Current operating branch" />
        <StatCard
          title="Tracked products"
          value={String(inventory.summary.trackedProductCount)}
          description="Products with branch stock visibility"
        />
        <StatCard
          title="Low stock"
          value={String(inventory.summary.lowStockCount)}
          description="At or below reorder level"
          tone={inventory.summary.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Out of stock"
          value={String(inventory.summary.outOfStockCount)}
          description="No available branch quantity"
          tone={inventory.summary.outOfStockCount > 0 ? "destructive" : "neutral"}
        />
        <StatCard
          title="Stock value"
          value={formatCurrency(inventory.summary.totalStockValue)}
          description="On-hand cost valuation"
        />
      </MetricGrid>

      <DataTableCard
        title="Stock balances"
        description={`${stockPagination.totalItems} product${
          stockPagination.totalItems === 1 ? "" : "s"
        } in the current stock view.`}
        contentClassName="p-0"
        toolbar={
          <DataTableFilters
            key={`${search}:${stockState}:${movementType}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px_220px]"
            pageParamName="stockPage"
            search={{
              value: search,
              placeholder: "Search product name, SKU, or barcode",
            }}
            filters={[
              {
                type: "select",
                name: "stockState",
                value: stockState,
                options: [
                  { value: "all", label: "All stock states" },
                  { value: "low", label: "Low stock" },
                  { value: "out", label: "No stock" },
                  { value: "missing", label: "Missing stock record" },
                ],
              },
              {
                type: "select",
                name: "movementType",
                value: movementType,
                options: [
                  { value: "", label: "All movement types" },
                  { value: "stock_in", label: formatInventoryMovementType("stock_in") },
                  { value: "adjustment", label: formatInventoryMovementType("adjustment") },
                  { value: "damaged", label: formatInventoryMovementType("damaged") },
                  { value: "service_usage", label: formatInventoryMovementType("service_usage") },
                  { value: "pos_sale", label: formatInventoryMovementType("pos_sale") },
                  { value: "return", label: formatInventoryMovementType("return") },
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={stockPagination.page}
            pageSize={stockPagination.pageSize}
            totalItems={stockPagination.totalItems}
            totalPages={stockPagination.totalPages}
            startItem={stockPagination.startItem}
            endItem={stockPagination.endItem}
            pageParamName="stockPage"
          />
        }
      >
        {stockPagination.totalItems === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No inventory matches the current filters"
              description="Try broadening the search or clear the current filters to review the full branch stock list."
            />
          </div>
        ) : (
          <DataTableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reorder</TableHead>
                  <TableHead>Shelf</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockPagination.items.map((stock) => (
                  <TableRow key={stock.productId}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{stock.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {stock.sku ?? "No SKU"} · {stock.unitLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatInventoryQuantity(stock.quantityOnHand)}</TableCell>
                    <TableCell>{formatInventoryQuantity(stock.reservedQuantity)}</TableCell>
                    <TableCell>{formatInventoryQuantity(stock.availableQuantity)}</TableCell>
                    <TableCell>
                      {stock.reorderLevel !== null
                        ? formatInventoryQuantity(stock.reorderLevel)
                        : "Not set"}
                    </TableCell>
                    <TableCell>{stock.shelfLocation ?? "Not set"}</TableCell>
                    <TableCell>
                      <InventoryStockStatusBadge stock={stock} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stock.quantityOnHand * stock.costPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <InventoryStockRowActions
                        product={{
                          id: stock.productId,
                          label: stock.productName,
                          sku: stock.sku,
                          quantityOnHand: stock.quantityOnHand,
                          availableQuantity: stock.availableQuantity,
                          reorderLevel: stock.reorderLevel,
                          shelfLocation: stock.shelfLocation,
                          hasStockRecord: stock.hasStockRecord,
                        }}
                        canCreateProducts={inventory.permissions.canCreateProducts}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>

      <DataTableCard
        title="Recent stock movements"
        description={`${movementPagination.totalItems} movement${
          movementPagination.totalItems === 1 ? "" : "s"
        } matched the current search and movement filters.`}
        contentClassName="p-0"
        footer={
          <DataTablePagination
            page={movementPagination.page}
            pageSize={movementPagination.pageSize}
            totalItems={movementPagination.totalItems}
            totalPages={movementPagination.totalPages}
            startItem={movementPagination.startItem}
            endItem={movementPagination.endItem}
            pageParamName="movementPage"
          />
        }
      >
        {movementPagination.totalItems === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No movement history found"
              description="Once stock is received, adjusted, damaged, used in service, or sold through POS, the movement log will appear here."
            />
          </div>
        ) : (
          <DataTableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Stock change</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementPagination.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.sku ?? "No SKU"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InventoryMovementTypeBadge type={movement.movementType} />
                    </TableCell>
                    <TableCell>{formatInventoryQuantity(movement.quantity)}</TableCell>
                    <TableCell>
                      {formatInventoryQuantity(movement.previousQuantity)} to{" "}
                      {formatInventoryQuantity(movement.newQuantity)}
                    </TableCell>
                    <TableCell>{movement.notes ?? "No notes"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}
