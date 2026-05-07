"use client";

import { SlidersHorizontal } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { InventorySettingsForm } from "@/features/inventory/components/inventory-settings-form";
import type { InventoryProductOption } from "@/features/inventory/types";

export function InventorySettingsDialog({ products }: { products: InventoryProductOption[] }) {
  return (
    <ModalDialog
      title="Stock settings"
      description="Manage branch-level reorder thresholds and shelf location without editing the product catalog."
      size="lg"
      trigger={({ openDialog }) => (
        <Button type="button" variant="outline" onClick={openDialog}>
          <SlidersHorizontal className="mr-2 size-4" />
          Stock settings
        </Button>
      )}
    >
      {() => <InventorySettingsForm products={products} />}
    </ModalDialog>
  );
}
