"use client";

import { useActionState, useMemo, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type {
  JobOrderDetailTab,
  JobOrderFormOptions,
  JobOrderItemType,
} from "@/features/job-orders/types";
import { addJobOrderItemAction } from "@/features/job-orders/actions/job-order-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderAdditionalItemForm({
  jobOrderId,
  options,
  redirectTab,
  closeDialog,
}: {
  jobOrderId: string;
  options: Pick<JobOrderFormOptions, "products" | "services">;
  redirectTab: JobOrderDetailTab;
  closeDialog: () => void;
}) {
  const [state, formAction] = useActionState(addJobOrderItemAction, INITIAL_FORM_ACTION_STATE);
  const [itemType, setItemType] = useState<JobOrderItemType | "">("");
  const [productId, setProductId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const isProductType = itemType === "product";
  const isServiceType = itemType === "service";
  const isLaborType = itemType === "labor";

  const isFormValid = useMemo(() => {
    if (!itemType) {
      return false;
    }

    if (isProductType && !productId) {
      return false;
    }

    if (isServiceType && !serviceId) {
      return false;
    }

    if (!description.trim()) {
      return false;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return false;
    }

    const parsedUnitPrice = Number(unitPrice);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return false;
    }

    return true;
  }, [description, isProductType, isServiceType, itemType, productId, quantity, serviceId, unitPrice]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="redirectTab" value={redirectTab} />

      <FormStatusMessage message={state.message} />

      <div className="space-y-2">
        <Label htmlFor="itemType">Item type</Label>
        <NativeSelect
          id="itemType"
          name="itemType"
          value={itemType}
          onChange={(event) => {
            const nextType = event.target.value as JobOrderItemType | "";
            setItemType(nextType);
            setProductId("");
            setServiceId("");
            setDescription("");
            setUnitPrice("");
          }}
        >
          <option value="">Select item type</option>
          <option value="product">Product</option>
          <option value="service">Service</option>
          <option value="labor">Manual labor</option>
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="itemType" />
      </div>

      {isProductType ? (
        <div className="space-y-2">
          <Label htmlFor="productId">Product</Label>
          <NativeSelect
            id="productId"
            name="productId"
            value={productId}
            onChange={(event) => {
              const nextProductId = event.target.value;
              const selected = options.products.find((product) => product.id === nextProductId);
              setProductId(nextProductId);
              setDescription(selected?.label ?? "");
              setUnitPrice(selected ? String(selected.unitPrice) : "");
            }}
          >
            <option value="">Select product</option>
            {options.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
                {product.sku ? ` (${product.sku})` : ""}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="productId" />
        </div>
      ) : isServiceType ? (
        <div className="space-y-2">
          <Label htmlFor="serviceId">Service</Label>
          <NativeSelect
            id="serviceId"
            name="serviceId"
            value={serviceId}
            onChange={(event) => {
              const nextServiceId = event.target.value;
              const selected = options.services.find((service) => service.id === nextServiceId);
              setServiceId(nextServiceId);
              setDescription(selected?.label ?? "");
              setUnitPrice(selected ? String(selected.unitPrice) : "");
            }}
          >
            <option value="">Select service</option>
            {options.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
                {service.category ? ` (${service.category})` : ""}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="serviceId" />
        </div>
      ) : isLaborType ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Manual labor entries do not require a catalog selection.
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="catalogSelection">Catalog item</Label>
          <NativeSelect id="catalogSelection" value="" disabled>
            <option value="">Select item type first</option>
          </NativeSelect>
        </div>
      )}

      {!isProductType ? <input type="hidden" name="productId" value="" /> : null}
      {!isServiceType ? <input type="hidden" name="serviceId" value="" /> : null}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the additional charge"
        />
        <FieldError errors={state.fieldErrors} name="description" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="quantity" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit price</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            inputMode="decimal"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            placeholder="0.00"
          />
          <FieldError errors={state.fieldErrors} name="unitPrice" />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Adding..." disabled={!isFormValid}>
          Add item
        </SubmitButton>
      </div>
    </form>
  );
}
