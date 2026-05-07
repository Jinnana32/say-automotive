"use client";

import { useActionState, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { updateInventoryStockSettingsAction } from "@/features/inventory/actions/inventory-actions";
import type { InventoryProductOption } from "@/features/inventory/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function InventorySettingsForm({ products }: { products: InventoryProductOption[] }) {
  const [state, formAction] = useActionState(
    updateInventoryStockSettingsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const initialProduct = products[0] ?? null;
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [reorderLevel, setReorderLevel] = useState(
    initialProduct?.reorderLevel !== null && initialProduct?.reorderLevel !== undefined
      ? String(initialProduct.reorderLevel)
      : "",
  );
  const [shelfLocation, setShelfLocation] = useState(initialProduct?.shelfLocation ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <FormStatusMessage message={state.message} />

      <div className="space-y-2">
        <Label htmlFor="settingsProductId">Product</Label>
        <NativeSelect
          id="settingsProductId"
          name="productId"
          value={productId}
          onChange={(event) => {
            const nextProduct = products.find((product) => product.id === event.target.value) ?? null;
            setProductId(event.target.value);
            setReorderLevel(
              nextProduct?.reorderLevel !== null && nextProduct?.reorderLevel !== undefined
                ? String(nextProduct.reorderLevel)
                : "",
            );
            setShelfLocation(nextProduct?.shelfLocation ?? "");
          }}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.label}
              {product.sku ? ` (${product.sku})` : ""}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="productId" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input
            id="reorderLevel"
            name="reorderLevel"
            inputMode="decimal"
            value={reorderLevel}
            onChange={(event) => setReorderLevel(event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="reorderLevel" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shelfLocation">Shelf location</Label>
          <Input
            id="shelfLocation"
            name="shelfLocation"
            value={shelfLocation}
            onChange={(event) => setShelfLocation(event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="shelfLocation" />
        </div>
      </div>

      <div className="flex justify-end border-t border-border/70 pt-5">
        <SubmitButton pendingLabel="Saving..." disabled={!productId}>
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
