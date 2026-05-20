"use client";

import { useActionState, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { markInventoryStockDamagedAction } from "@/features/inventory/actions/inventory-actions";
import type { InventoryProductOption } from "@/features/inventory/types";
import { formatInventoryQuantity } from "@/features/inventory/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function InventoryDamageForm({ products }: { products: InventoryProductOption[] }) {
  const [state, formAction] = useActionState(
    markInventoryStockDamagedAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [productId, setProductId] = useState("");
  const { values, updateFormValue } = useFormValues({
    quantity: "",
    notes: "",
  });
  const selectedProduct = products.find((product) => product.id === productId) ?? null;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Mark damaged stock</CardTitle>
        <CardDescription>
          Remove damaged or unusable stock from the branch while preserving a movement record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="damageProductId">Product</Label>
            <select
              id="damageProductId"
              name="productId"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors} name="productId" />
          </div>

          {selectedProduct ? (
            <p className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Available quantity {formatInventoryQuantity(selectedProduct.availableQuantity)} · Shelf{" "}
              {selectedProduct.shelfLocation ?? "Not set"}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="damageQuantity">Damaged quantity</Label>
            <Input id="damageQuantity" name="quantity" inputMode="decimal" value={values.quantity} onChange={(event) => updateFormValue("quantity", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="quantity" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="damageNotes">Notes (required)</Label>
            <Textarea id="damageNotes" name="notes" value={values.notes} onChange={(event) => updateFormValue("notes", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="notes" />
          </div>

          <SubmitButton pendingLabel="Saving..." disabled={!productId}>
            Mark damaged
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
