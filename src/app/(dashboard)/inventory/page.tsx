import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryFilterToolbar } from "@/features/inventory/components/inventory-filter-toolbar";
import { InventoryMovementDialog } from "@/features/inventory/components/inventory-movement-dialog";
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
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams: Promise<{
    search?: string;
    stockState?: InventoryStockFilterState;
    movementType?: InventoryMovementType;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const { search = "", stockState = "all", movementType = "" } = await searchParams;
  const inventory = await getInventoryDashboardData({
    search,
    stockState,
    movementType,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock administration, stock health, and the movement ledger."
        actions={
          <>
            <InventoryMovementDialog products={inventory.productOptions} />
            <InventorySettingsDialog products={inventory.productOptions} />
            <Button asChild variant="outline">
              <Link href="/products">Review products</Link>
            </Button>
          </>
        }
      />

      <MetricGrid className="xl:grid-cols-5">
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
        description="Search the active catalog and review stock health before making adjustments."
        contentClassName="p-0"
        toolbar={
          <InventoryFilterToolbar
            key={`${search}::${stockState}::${movementType}`}
            search={search}
            stockState={stockState}
            movementType={movementType}
          />
        }
      >
        {inventory.stocks.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No inventory matches the current filters"
              description="Try broadening the search or clear the current filters to review the full branch stock list."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {inventory.stocks.map((stock) => (
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
                      <TableRowActionsMenu label={`Inventory actions for ${stock.productName}`}>
                        <InventoryMovementDialog
                          prefilledProduct={{
                            id: stock.productId,
                            label: stock.productName,
                            sku: stock.sku,
                            quantityOnHand: stock.quantityOnHand,
                            availableQuantity: stock.availableQuantity,
                            reorderLevel: stock.reorderLevel,
                            shelfLocation: stock.shelfLocation,
                            hasStockRecord: stock.hasStockRecord,
                          }}
                          lockProduct
                          trigger={({ openDialog }) => (
                            <TableRowActionsMenuButton
                              label="Adjust stock"
                              onSelect={openDialog}
                            />
                          )}
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

      <DataTableCard
        title="Recent stock movements"
        description="Append-only ledger of every inventory change with before and after quantity."
        contentClassName="p-0"
      >
        {inventory.movements.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No movement history found"
              description="Once stock is received, adjusted, damaged, used in service, or sold through POS, the movement log will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {inventory.movements.map((movement) => (
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
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
