"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { INITIAL_INLINE_PRODUCT_ACTION_STATE } from "@/features/products/inline-product-action-state";
import {
  createInlineProductAction,
} from "@/features/products/actions/product-actions";
import type {
  ProductFormOptionsData,
  ProductInlineCreateResult,
  ProductType,
} from "@/features/products/types";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
import { useFormValues } from "@/lib/use-form-values";

type ProductOptionsState =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "ready"; data: ProductFormOptionsData; error: null }
  | { status: "error"; data: null; error: string };

const INITIAL_OPTIONS_STATE: ProductOptionsState = {
  status: "idle",
  data: null,
  error: null,
};

const INITIAL_VALUES = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  supplierId: "",
  unitId: "",
  productType: "part" as ProductType,
  costPrice: formatMoneyInputValue(0),
  sellingPrice: formatMoneyInputValue(0),
  reorderLevel: "0",
  shelfLocation: "",
};

export function QuickCreateProductDialog({
  onCreated,
  triggerLabel = "Add new product",
  triggerVariant = "outline",
  triggerSize = "sm",
}: {
  onCreated: (product: ProductInlineCreateResult) => void;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setInstanceKey((current) => current + 1);
    }
  }, [open]);

  return (
    <QuickCreateProductDialogForm
      key={instanceKey}
      open={open}
      onOpenChange={setOpen}
      onCreated={onCreated}
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
    />
  );
}

function QuickCreateProductDialogForm({
  open,
  onOpenChange,
  onCreated,
  triggerLabel,
  triggerVariant,
  triggerSize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (product: ProductInlineCreateResult) => void;
  triggerLabel: string;
  triggerVariant: ButtonProps["variant"];
  triggerSize: ButtonProps["size"];
}) {
  const [state, formAction] = useActionState(
    createInlineProductAction,
    INITIAL_INLINE_PRODUCT_ACTION_STATE,
  );
  const [optionsState, setOptionsState] = useState<ProductOptionsState>(
    INITIAL_OPTIONS_STATE,
  );
  const { values, updateFormValue } = useFormValues(INITIAL_VALUES);

  useEffect(() => {
    if (!open || optionsState.status === "ready" || optionsState.status === "loading") {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadOptions() {
      setOptionsState({ status: "loading", data: null, error: null });

      try {
        const response = await fetch("/api/products/form-options", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load product form options.");
        }

        const data = (await response.json()) as ProductFormOptionsData;

        if (isMounted) {
          setOptionsState({ status: "ready", data, error: null });
        }
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setOptionsState({
          status: "error",
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load product form options.",
        });
      }
    }

    void loadOptions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [open, optionsState.status]);

  useEffect(() => {
    if (state.status !== "success" || !state.product) {
      return;
    }

    onCreated(state.product);
    onOpenChange(false);
  }, [onCreated, onOpenChange, state]);

  const options = optionsState.status === "ready" ? optionsState.data : null;

  return (
    <ModalDialog
      title="Add new product"
      description="Create a branch product record without leaving the current workflow."
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          onClick={openDialog}
        >
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="partNumber" value="" />
          <input type="hidden" name="oemNumber" value="" />
          <input type="hidden" name="description" value="" />
          <input type="hidden" name="owningBranchId" value="" />
          <input type="hidden" name="shareGlobally" value="" />
          <input type="hidden" name="warrantyDurationDays" value="" />
          <input type="hidden" name="websiteVisible" value="" />
          <input type="hidden" name="websiteFeatured" value="" />
          <input type="hidden" name="websiteSortOrder" value="0" />
          <input type="hidden" name="websiteSlug" value="" />
          <input type="hidden" name="productImageUrl" value="" />
          <input type="hidden" name="websiteImageUrl" value="" />
          <input type="hidden" name="websiteShortDescription" value="" />
          <input type="hidden" name="websiteBadge" value="" />
          <input type="hidden" name="status" value="active" />

          <FormStatusMessage message={state.message} />

          {optionsState.status === "error" ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {optionsState.error}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quickProductName">Product name</Label>
              <Input
                id="quickProductName"
                name="name"
                value={values.name}
                onChange={(event) => updateFormValue("name", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductType">Product type</Label>
              <NativeSelect
                id="quickProductType"
                name="productType"
                value={values.productType}
                onChange={(event) =>
                  updateFormValue("productType", event.target.value as ProductType)
                }
              >
                <option value="part">Part</option>
                <option value="fluid">Fluid</option>
                <option value="consumable">Consumable</option>
                <option value="accessory">Accessory</option>
                <option value="tool">Tool</option>
              </NativeSelect>
              <FieldError errors={state.fieldErrors} name="productType" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quickProductSku">SKU</Label>
              <Input
                id="quickProductSku"
                name="sku"
                value={values.sku}
                onChange={(event) => updateFormValue("sku", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="sku" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductBarcode">Barcode</Label>
              <Input
                id="quickProductBarcode"
                name="barcode"
                value={values.barcode}
                onChange={(event) => updateFormValue("barcode", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="barcode" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductUnit">Base unit</Label>
              <NativeSelect
                id="quickProductUnit"
                name="unitId"
                value={values.unitId}
                disabled={!options}
                onChange={(event) => updateFormValue("unitId", event.target.value)}
              >
                <option value="">
                  {options ? "Select unit" : "Loading units..."}
                </option>
                {options?.units.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={state.fieldErrors} name="unitId" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quickProductSellingPrice">Selling price</Label>
              <Input
                id="quickProductSellingPrice"
                name="sellingPrice"
                inputMode="decimal"
                type="number"
                step={MONEY_INPUT_STEP}
                value={values.sellingPrice}
                onChange={(event) =>
                  updateFormValue("sellingPrice", event.target.value)
                }
              />
              <FieldError errors={state.fieldErrors} name="sellingPrice" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductCostPrice">Cost price</Label>
              <Input
                id="quickProductCostPrice"
                name="costPrice"
                inputMode="decimal"
                type="number"
                step={MONEY_INPUT_STEP}
                value={values.costPrice}
                onChange={(event) => updateFormValue("costPrice", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="costPrice" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductReorder">Reorder level</Label>
              <Input
                id="quickProductReorder"
                name="reorderLevel"
                inputMode="decimal"
                type="number"
                step={MONEY_INPUT_STEP}
                value={values.reorderLevel}
                onChange={(event) =>
                  updateFormValue("reorderLevel", event.target.value)
                }
              />
              <FieldError errors={state.fieldErrors} name="reorderLevel" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <SelectField
              id="quickProductCategory"
              name="categoryId"
              label="Category"
              value={values.categoryId}
              disabled={!options}
              options={options?.categories ?? []}
              onChange={(value) => updateFormValue("categoryId", value)}
            />
            <SelectField
              id="quickProductBrand"
              name="brandId"
              label="Brand"
              value={values.brandId}
              disabled={!options}
              options={options?.brands ?? []}
              onChange={(value) => updateFormValue("brandId", value)}
            />
            <SelectField
              id="quickProductSupplier"
              name="supplierId"
              label="Supplier"
              value={values.supplierId}
              disabled={!options}
              options={options?.suppliers ?? []}
              onChange={(value) => updateFormValue("supplierId", value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickProductShelfLocation">Shelf location</Label>
            <Input
              id="quickProductShelfLocation"
              name="shelfLocation"
              value={values.shelfLocation}
              onChange={(event) =>
                updateFormValue("shelfLocation", event.target.value)
              }
              placeholder="Optional shelf/bin reference"
            />
            <FieldError errors={state.fieldErrors} name="shelfLocation" />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Creating..." disabled={!options}>
              Create product
            </SubmitButton>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: ProductFormOptionsData["categories"];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
