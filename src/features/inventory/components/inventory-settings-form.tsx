"use client";

import { useActionState, useState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
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
  const [productId, setProductId] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <FormStatusMessage message={state.message} />

      <div className="space-y-2">
        <Label htmlFor="settingsProductId" required>
          Product
        </Label>
        <NativeSelect
          id="settingsProductId"
          name="productId"
          value={productId}
          className={fieldControlClassName(state.fieldErrors, "productId")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "productId",
            required: true,
            errorId: fieldErrorId("productId"),
          })}
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
        <FieldError errors={state.fieldErrors} name="productId" id={fieldErrorId("productId")} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reorderLevel" optional>Reorder level</Label>
          <Input
            id="reorderLevel"
            name="reorderLevel"
            inputMode="decimal"
            value={reorderLevel}
            className={fieldControlClassName(state.fieldErrors, "reorderLevel")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "reorderLevel",
              required: false,
              errorId: fieldErrorId("reorderLevel"),
            })}
            onChange={(event) => setReorderLevel(event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="reorderLevel" id={fieldErrorId("reorderLevel")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shelfLocation" optional>Shelf location</Label>
          <Input
            id="shelfLocation"
            name="shelfLocation"
            value={shelfLocation}
            className={fieldControlClassName(state.fieldErrors, "shelfLocation")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "shelfLocation",
              required: false,
              errorId: fieldErrorId("shelfLocation"),
            })}
            onChange={(event) => setShelfLocation(event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="shelfLocation" id={fieldErrorId("shelfLocation")} />
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
