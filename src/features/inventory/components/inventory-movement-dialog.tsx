"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { TableRowActionsMenuButton } from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { submitInventoryMovementAction } from "@/features/inventory/actions/inventory-actions";
import type { InventoryMovementAdminMode, InventoryProductOption } from "@/features/inventory/types";
import { formatInventoryQuantity } from "@/features/inventory/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

const INVENTORY_MOVEMENT_MODES: Array<{
  value: InventoryMovementAdminMode;
  label: string;
  description: string;
}> = [
  {
    value: "stock_in",
    label: "Receive stock",
    description: "Use this when new inventory arrives or when stock is loaded into the branch.",
  },
  {
    value: "recount",
    label: "Recount and adjust",
    description: "Set the physical counted quantity after a stock count.",
  },
  {
    value: "damaged",
    label: "Mark damaged stock",
    description: "Remove damaged or unusable stock while preserving the movement ledger.",
  },
];

export function InventoryMovementDialog({
  products,
  prefilledProduct,
  lockProduct = false,
  triggerMode = "button",
  triggerLabel,
  triggerText,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  products?: InventoryProductOption[];
  prefilledProduct?: InventoryProductOption;
  lockProduct?: boolean;
  triggerMode?: "button" | "icon" | "quiet" | "menu-item";
  triggerLabel?: string;
  triggerText?: string;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    submitInventoryMovementAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const availableProducts = useMemo(
    () => (prefilledProduct ? [prefilledProduct] : products ?? []),
    [prefilledProduct, products],
  );
  const initialProductId = prefilledProduct?.id ?? "";
  const [movementMode, setMovementMode] = useState<InventoryMovementAdminMode>("stock_in");
  const [productId, setProductId] = useState(initialProductId);
  const { values, updateFormValue, setValues } = useFormValues({
    quantity: "",
    notes: "",
  });

  const selectedProduct = useMemo(
    () => availableProducts.find((product) => product.id === productId) ?? null,
    [availableProducts, productId],
  );
  const movementMeta =
    INVENTORY_MOVEMENT_MODES.find((mode) => mode.value === movementMode) ??
    INVENTORY_MOVEMENT_MODES[0];
  const reservedQuantity = selectedProduct
    ? selectedProduct.quantityOnHand - selectedProduct.availableQuantity
    : 0;
  const quantityLabel =
    movementMode === "recount"
      ? "Counted quantity"
      : movementMode === "damaged"
        ? "Damaged quantity"
        : "Received quantity";
  const pendingLabel =
    movementMode === "recount"
      ? "Adjusting..."
      : movementMode === "damaged"
        ? "Saving..."
        : "Receiving...";
  const submitLabel =
    movementMode === "recount"
      ? "Save recount"
      : movementMode === "damaged"
        ? "Mark damaged"
        : "Receive stock";
  const resolvedTriggerLabel =
    triggerLabel ??
    (prefilledProduct
      ? `Record movement for ${prefilledProduct.label}`
      : "Record movement");
  const previousOpenRef = useRef(false);

  const resetDialogState = useCallback(() => {
    setMovementMode("stock_in");
    setProductId(initialProductId);
    setValues({
      quantity: "",
      notes: "",
    });
  }, [initialProductId, setValues]);

  useEffect(() => {
    const isOpen = open ?? false;

    if (isOpen && !previousOpenRef.current) {
      resetDialogState();
    }

    previousOpenRef.current = isOpen;
  }, [open, resetDialogState]);

  const resolvedTrigger = showTrigger
    ? ({ openDialog }: { openDialog: () => void }) => {
        const handleOpen = () => {
          resetDialogState();
          openDialog();
        };

        return triggerMode === "icon" ? (
          <IconActionButton
            label={resolvedTriggerLabel}
            icon={ArrowUpDown}
            onClick={handleOpen}
          />
        ) : triggerMode === "menu-item" ? (
          <TableRowActionsMenuButton
            label={triggerText ?? "Adjust stock"}
            onSelect={handleOpen}
          />
        ) : triggerMode === "quiet" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium"
            onClick={handleOpen}
            aria-label={resolvedTriggerLabel}
            title={resolvedTriggerLabel}
          >
            {triggerText ?? "Adjust stock"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleOpen}
          >
            <ArrowUpDown className="mr-2 size-4" />
            Record movement
          </Button>
        );
      }
    : undefined;

  return (
    <ModalDialog
      title="Record stock movement"
      description="Run one stock adjustment from a single admin form instead of leaving the inventory page."
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
    >
      {({ closeDialog }) => (
        <form action={formAction} className="space-y-5">
          <FormStatusMessage message={state.message} />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inventoryMovementMode">Movement approach</Label>
              <NativeSelect
                id="inventoryMovementMode"
                name="movementMode"
                value={movementMode}
                onChange={(event) => {
                  setMovementMode(event.target.value as InventoryMovementAdminMode);
                  setValues((current) => ({ ...current, quantity: "" }));
                }}
              >
                {INVENTORY_MOVEMENT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-sm text-muted-foreground">{movementMeta.description}</p>
              <FieldError errors={state.fieldErrors} name="movementMode" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryMovementProductId">Product</Label>
              {lockProduct && productId ? <input type="hidden" name="productId" value={productId} /> : null}
              <NativeSelect
                id="inventoryMovementProductId"
                name={lockProduct ? undefined : "productId"}
                value={productId}
                disabled={lockProduct}
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="">Select product</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                    {product.sku ? ` (${product.sku})` : ""}
                  </option>
                ))}
              </NativeSelect>
              {lockProduct ? (
                <p className="text-xs text-muted-foreground">
                  Product is locked to the inventory row you launched from.
                </p>
              ) : null}
              <FieldError errors={state.fieldErrors} name="productId" />
            </div>
          </div>

          {selectedProduct ? (
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="font-medium text-foreground">On hand</p>
                <p>{formatInventoryQuantity(selectedProduct.quantityOnHand)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Available</p>
                <p>{formatInventoryQuantity(selectedProduct.availableQuantity)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Reserved</p>
                <p>{formatInventoryQuantity(reservedQuantity)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Shelf</p>
                <p>{selectedProduct.shelfLocation ?? "Not set"}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="inventoryMovementQuantity">{quantityLabel}</Label>
              <Input
                id="inventoryMovementQuantity"
                name="quantity"
                inputMode="decimal"
                value={values.quantity}
                onChange={(event) => updateFormValue("quantity", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="quantity" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryMovementNotes">Notes</Label>
              <Textarea
                id="inventoryMovementNotes"
                name="notes"
                value={values.notes}
                onChange={(event) => updateFormValue("notes", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="notes" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <SubmitButton pendingLabel={pendingLabel} disabled={!productId}>
              {submitLabel}
            </SubmitButton>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}
