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
            <Label htmlFor="damageProductId" required>
              Product
            </Label>
            <select
              id="damageProductId"
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
              Available quantity {formatInventoryQuantity(selectedProduct.availableQuantity)} · Shelf{" "}
              {selectedProduct.shelfLocation ?? "Not set"}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="damageQuantity" required>
              Damaged quantity
            </Label>
            <Input
              id="damageQuantity"
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
            <Label htmlFor="damageNotes" required>
              Notes
            </Label>
            <Textarea
              id="damageNotes"
              name="notes"
              value={values.notes}
              onChange={(event) => updateFormValue("notes", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "notes")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "notes",
                required: true,
                errorId: fieldErrorId("notes"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
          </div>

          <SubmitButton pendingLabel="Saving..." disabled={!productId}>
            Mark damaged
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
