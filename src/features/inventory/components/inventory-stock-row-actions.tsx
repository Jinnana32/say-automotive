import { InventoryMovementDialog } from "@/features/inventory/components/inventory-movement-dialog";
import type { InventoryProductOption } from "@/features/inventory/types";

export function InventoryStockRowActions({
  product,
  canCreateProducts = false,
}: {
  product: InventoryProductOption;
  canCreateProducts?: boolean;
}) {
  return (
    <InventoryMovementDialog
      prefilledProduct={product}
      lockProduct
      triggerMode="icon"
      triggerLabel={`Adjust stock for ${product.label}`}
      canCreateProducts={canCreateProducts}
    />
  );
}
