"use client";

import { useState } from "react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { InventoryMovementDialog } from "@/features/inventory/components/inventory-movement-dialog";
import type { InventoryProductOption } from "@/features/inventory/types";

export function InventoryStockRowActions({
  product,
  canCreateProducts = false,
}: {
  product: InventoryProductOption;
  canCreateProducts?: boolean;
}) {
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Inventory actions for ${product.label}`}>
        <TableRowActionsMenuButton label="Adjust stock" onSelect={() => setIsAdjustOpen(true)} />
      </TableRowActionsMenu>
      <InventoryMovementDialog
        prefilledProduct={product}
        lockProduct
        canCreateProducts={canCreateProducts}
        showTrigger={false}
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
      />
    </>
  );
}
