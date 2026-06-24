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
import { reconcileInventoryStockAction } from "@/features/inventory/actions/inventory-actions";
import type { InventoryProductOption } from "@/features/inventory/types";
import { formatInventoryQuantity } from "@/features/inventory/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function InventoryRecountForm({ products }: { products: InventoryProductOption[] }) {
  const [state, formAction] = useActionState(
    reconcileInventoryStockAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [productId, setProductId] = useState("");
  const { values, updateFormValue } = useFormValues({
    countedQuantity: "",
    notes: "",
  });
  const selectedProduct = products.find((product) => product.id === productId) ?? null;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Recount and adjust</CardTitle>
        <CardDescription>
          Set the physical counted quantity after a stock count. This writes an adjustment movement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="recountProductId" required>
              Product
            </Label>
            <select
              id="recountProductId"
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
              Current on hand {formatInventoryQuantity(selectedProduct.quantityOnHand)} · Reserved{" "}
              {formatInventoryQuantity(
                selectedProduct.quantityOnHand - selectedProduct.availableQuantity,
              )}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="countedQuantity" required>
              Counted quantity
            </Label>
            <Input
              id="countedQuantity"
              name="countedQuantity"
              inputMode="decimal"
              value={values.countedQuantity}
              onChange={(event) => updateFormValue("countedQuantity", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "countedQuantity")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "countedQuantity",
                required: true,
                errorId: fieldErrorId("countedQuantity"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="countedQuantity" id={fieldErrorId("countedQuantity")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recountNotes" required>
              Notes
            </Label>
            <Textarea
              id="recountNotes"
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

          <SubmitButton pendingLabel="Adjusting..." disabled={!productId}>
            Save recount
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
