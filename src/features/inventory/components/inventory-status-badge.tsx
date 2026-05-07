import { Badge } from "@/components/ui/badge";
import type { InventoryMovementType, InventoryStockItem } from "@/features/inventory/types";
import { formatInventoryMovementType } from "@/features/inventory/utils";

export function InventoryStockStatusBadge({ stock }: { stock: InventoryStockItem }) {
  if (!stock.hasStockRecord) {
    return <Badge variant="destructive">No stock</Badge>;
  }

  if (stock.isOutOfStock) {
    return <Badge variant="destructive">No stock</Badge>;
  }

  if (stock.isLowStock) {
    return <Badge variant="warning">Low stock</Badge>;
  }

  return <Badge variant="success">In stock</Badge>;
}

export function InventoryMovementTypeBadge({ type }: { type: InventoryMovementType }) {
  const variant =
    type === "stock_in"
      ? "success"
      : type === "damaged"
        ? "destructive"
        : type === "adjustment"
          ? "warning"
          : type === "return"
            ? "secondary"
            : "outline";

  return <Badge variant={variant}>{formatInventoryMovementType(type)}</Badge>;
}
