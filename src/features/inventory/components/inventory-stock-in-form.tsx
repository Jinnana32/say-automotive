"use client";

import { useActionState, useState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { receiveInventoryStockAction } from "@/features/inventory/actions/inventory-actions";
import type { InventoryProductOption } from "@/features/inventory/types";
import { formatInventoryQuantity } from "@/features/inventory/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function InventoryStockInForm({ products }: { products: InventoryProductOption[] }) {
  const [state, formAction] = useActionState(
    receiveInventoryStockAction,
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
        <CardTitle>Receive stock</CardTitle>
        <CardDescription>
          Use this when new inventory arrives or when stock is being loaded into the branch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="stockInProductId" required>
              Product
            </Label>
            <select
              id="stockInProductId"
              name="productId"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className={formSelectClassName(state.fieldErrors, "productId")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "productId",
                required: true,
                errorId: fieldErrorId("productId"),
              })}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors} name="productId" id={fieldErrorId("productId")} />
          </div>

          {selectedProduct ? (
            <p className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Current on hand {formatInventoryQuantity(selectedProduct.quantityOnHand)} · Available{" "}
              {formatInventoryQuantity(selectedProduct.availableQuantity)}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="stockInQuantity" required>
              Received quantity
            </Label>
            <Input
              id="stockInQuantity"
              name="quantity"
              inputMode="decimal"
              value={values.quantity}
              onChange={(event) => updateFormValue("quantity", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "quantity")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "quantity",
                required: true,
                errorId: fieldErrorId("quantity"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="quantity" id={fieldErrorId("quantity")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockInNotes" optional>Notes</Label>
            <Textarea
              id="stockInNotes"
              name="notes"
              value={values.notes}
              className={fieldControlClassName(state.fieldErrors, "notes")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "notes",
                required: false,
                errorId: fieldErrorId("notes"),
              })}
              onChange={(event) => updateFormValue("notes", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
          </div>

          <SubmitButton pendingLabel="Receiving..." disabled={!productId}>
            Receive stock
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
