"use client";

import { useActionState, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  JobOrderFormOptions,
  JobOrderItemType,
} from "@/features/job-orders/types";
import { addJobOrderItemAction } from "@/features/job-orders/actions/job-order-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderAdditionalItemForm({
  jobOrderId,
  options,
}: {
  jobOrderId: string;
  options: Pick<JobOrderFormOptions, "products" | "services">;
}) {
  const [state, formAction] = useActionState(addJobOrderItemAction, INITIAL_FORM_ACTION_STATE);
  const [itemType, setItemType] = useState<JobOrderItemType>("product");
  const [productId, setProductId] = useState(options.products[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(options.services[0]?.id ?? "");
  const [description, setDescription] = useState(options.products[0]?.label ?? "");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState(
    options.products[0] ? String(options.products[0].unitPrice) : "0",
  );

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Add additional item</CardTitle>
        <CardDescription>
          Extra charges become pending for customer approval and do not silently change the billable total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="jobOrderId" value={jobOrderId} />

          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="itemType">Item type</Label>
            <select
              id="itemType"
              name="itemType"
              value={itemType}
              onChange={(event) => {
                const nextType = event.target.value as JobOrderItemType;
                setItemType(nextType);

                if (nextType === "product") {
                  const selected = options.products[0];
                  setProductId(selected?.id ?? "");
                  setServiceId("");
                  setDescription(selected?.label ?? "");
                  setUnitPrice(selected ? String(selected.unitPrice) : "0");
                  return;
                }

                if (nextType === "service") {
                  const selected = options.services[0];
                  setServiceId(selected?.id ?? "");
                  setProductId("");
                  setDescription(selected?.label ?? "");
                  setUnitPrice(selected ? String(selected.unitPrice) : "0");
                  return;
                }

                setProductId("");
                setServiceId("");
                setDescription("");
                setUnitPrice("0");
              }}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="labor">Manual labor</option>
            </select>
          </div>

          {itemType === "product" ? (
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                name="productId"
                value={productId}
                onChange={(event) => {
                  const nextProductId = event.target.value;
                  const selected = options.products.find((product) => product.id === nextProductId);
                  setProductId(nextProductId);
                  setDescription(selected?.label ?? "");
                  setUnitPrice(selected ? String(selected.unitPrice) : "0");
                }}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select product</option>
                {options.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                    {product.sku ? ` (${product.sku})` : ""}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="productId" />
            </div>
          ) : null}

          {itemType === "service" ? (
            <div className="space-y-2">
              <Label htmlFor="serviceId">Service</Label>
              <select
                id="serviceId"
                name="serviceId"
                value={serviceId}
                onChange={(event) => {
                  const nextServiceId = event.target.value;
                  const selected = options.services.find((service) => service.id === nextServiceId);
                  setServiceId(nextServiceId);
                  setDescription(selected?.label ?? "");
                  setUnitPrice(selected ? String(selected.unitPrice) : "0");
                }}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select service</option>
                {options.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                    {service.category ? ` (${service.category})` : ""}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="serviceId" />
            </div>
          ) : null}

          {itemType !== "product" ? <input type="hidden" name="productId" value="" /> : null}
          {itemType !== "service" ? <input type="hidden" name="serviceId" value="" /> : null}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
              />
              <FieldError errors={state.fieldErrors} name="unitPrice" />
            </div>
          </div>

          <div className="flex justify-end">
            <SubmitButton>Add additional item</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
