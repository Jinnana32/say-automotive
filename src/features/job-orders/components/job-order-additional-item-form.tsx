"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { JobOrderDetailTab, JobOrderItemType } from "@/features/job-orders/types";
import { addJobOrderItemAction } from "@/features/job-orders/actions/job-order-actions";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { QuickCreateServiceDialog } from "@/features/services/components/quick-create-service-dialog";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

type CatalogOptions = {
  products: Array<{ id: string; label: string; sku: string | null; unitPrice: number }>;
  services: Array<{ id: string; label: string; category: string | null; unitPrice: number }>;
  permissions: {
    canCreateProducts: boolean;
    canCreateServices: boolean;
  };
};

export function JobOrderAdditionalItemForm({
  jobOrderId,
  redirectTab,
  closeDialog,
}: {
  jobOrderId: string;
  redirectTab: JobOrderDetailTab;
  closeDialog: () => void;
}) {
  const [state, formAction] = useActionState(addJobOrderItemAction, INITIAL_FORM_ACTION_STATE);
  const [catalogState, setCatalogState] = useState<
    | { status: "loading"; options: null; error: null }
    | { status: "ready"; options: CatalogOptions; error: null }
    | { status: "error"; options: null; error: string }
  >({
    status: "loading",
    options: null,
    error: null,
  });
  const [itemType, setItemType] = useState<JobOrderItemType | "">("");
  const [productId, setProductId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadCatalogOptions() {
      try {
        const response = await fetch("/api/job-orders/item-options", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load catalog options.");
        }

        const data = (await response.json()) as CatalogOptions;

        if (isMounted) {
          setCatalogState({ status: "ready", options: data, error: null });
        }
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setCatalogState({
          status: "error",
          options: null,
          error: error instanceof Error ? error.message : "Unable to load catalog options.",
        });
      }
    }

    loadCatalogOptions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const catalogOptions = catalogState.status === "ready" ? catalogState.options : null;
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
      <FormRequiredFieldsNote />

      {catalogState.status === "error" ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {catalogState.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="itemType" required>
          Item type
        </Label>
        <NativeSelect
          id="itemType"
          name="itemType"
          value={itemType}
          className={fieldControlClassName(state.fieldErrors, "itemType")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "itemType",
            required: true,
            errorId: fieldErrorId("itemType"),
          })}
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
        <FieldError errors={state.fieldErrors} name="itemType" id={fieldErrorId("itemType")} />
      </div>

      {isProductType ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="productId" required>
              Product
            </Label>
            {catalogOptions?.permissions.canCreateProducts ? (
              <QuickCreateProductDialog
                triggerLabel="Add new product"
                onCreated={(product) => {
                  setCatalogState((current) =>
                    current.status === "ready"
                      ? {
                          status: "ready",
                          error: null,
                          options: {
                            ...current.options,
                            products: current.options.products.some(
                              (entry) => entry.id === product.id,
                            )
                              ? current.options.products.map((entry) =>
                                  entry.id === product.id
                                    ? {
                                        id: product.id,
                                        label: product.label,
                                        sku: product.sku,
                                        unitPrice: product.unitPrice,
                                      }
                                    : entry,
                                )
                              : [
                                  ...current.options.products,
                                  {
                                    id: product.id,
                                    label: product.label,
                                    sku: product.sku,
                                    unitPrice: product.unitPrice,
                                  },
                                ],
                          },
                        }
                      : current,
                  );
                  setProductId(product.id);
                  setDescription(product.label);
                  setUnitPrice(formatMoneyInputValue(product.unitPrice));
                }}
              />
            ) : null}
          </div>
          {catalogOptions ? (
            <NativeSelect
              id="productId"
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
                const nextProductId = event.target.value;
                const selected = catalogOptions.products.find((product) => product.id === nextProductId);
                setProductId(nextProductId);
                setDescription(selected?.label ?? "");
                setUnitPrice(selected ? formatMoneyInputValue(selected.unitPrice) : "");
              }}
            >
              <option value="">Select product</option>
              {catalogOptions.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <NativeSelect id="productId" disabled value="">
              <option value="">Loading products...</option>
            </NativeSelect>
          )}
          <FieldError errors={state.fieldErrors} name="productId" id={fieldErrorId("productId")} />
        </div>
      ) : isServiceType ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="serviceId" required>
              Service
            </Label>
            {catalogOptions?.permissions.canCreateServices ? (
              <QuickCreateServiceDialog
                triggerLabel="Add new service"
                onCreated={(service) => {
                  setCatalogState((current) =>
                    current.status === "ready"
                      ? {
                          status: "ready",
                          error: null,
                          options: {
                            ...current.options,
                            services: current.options.services.some(
                              (entry) => entry.id === service.id,
                            )
                              ? current.options.services.map((entry) =>
                                  entry.id === service.id
                                    ? {
                                        id: service.id,
                                        label: service.label,
                                        category: service.category,
                                        unitPrice: service.unitPrice,
                                      }
                                    : entry,
                                )
                              : [
                                  ...current.options.services,
                                  {
                                    id: service.id,
                                    label: service.label,
                                    category: service.category,
                                    unitPrice: service.unitPrice,
                                  },
                                ],
                          },
                        }
                      : current,
                  );
                  setServiceId(service.id);
                  setDescription(service.label);
                  setUnitPrice(formatMoneyInputValue(service.unitPrice));
                }}
              />
            ) : null}
          </div>
          {catalogOptions ? (
            <NativeSelect
              id="serviceId"
              name="serviceId"
              value={serviceId}
              className={fieldControlClassName(state.fieldErrors, "serviceId")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "serviceId",
                required: true,
                errorId: fieldErrorId("serviceId"),
              })}
              onChange={(event) => {
                const nextServiceId = event.target.value;
                const selected = catalogOptions.services.find((service) => service.id === nextServiceId);
                setServiceId(nextServiceId);
                setDescription(selected?.label ?? "");
                setUnitPrice(selected ? formatMoneyInputValue(selected.unitPrice) : "");
              }}
            >
              <option value="">Select service</option>
              {catalogOptions.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                  {service.category ? ` (${service.category})` : ""}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <NativeSelect id="serviceId" disabled value="">
              <option value="">Loading services...</option>
            </NativeSelect>
          )}
          <FieldError errors={state.fieldErrors} name="serviceId" id={fieldErrorId("serviceId")} />
        </div>
      ) : isLaborType ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Manual labor entries do not require a catalog selection.
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="catalogSelection" optional>
            Catalog item
          </Label>
          <NativeSelect id="catalogSelection" value="" disabled>
            <option value="">Select item type first</option>
          </NativeSelect>
        </div>
      )}

      {!isProductType ? <input type="hidden" name="productId" value="" /> : null}
      {!isServiceType ? <input type="hidden" name="serviceId" value="" /> : null}

      <div className="space-y-2">
        <Label htmlFor="description" required>
          Description
        </Label>
        <Input
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the additional charge"
          className={fieldControlClassName(state.fieldErrors, "description")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "description",
            required: true,
            errorId: fieldErrorId("description"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="description" id={fieldErrorId("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity" required>
            Quantity
          </Label>
          <Input
            id="quantity"
            name="quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
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
          <Label htmlFor="unitPrice" required>
            Unit price
          </Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            placeholder="0.00"
            className={fieldControlClassName(state.fieldErrors, "unitPrice")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "unitPrice",
              required: true,
              errorId: fieldErrorId("unitPrice"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="unitPrice" id={fieldErrorId("unitPrice")} />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Adding..." disabled={!isFormValid} variant="add">
          <Plus className="size-4" />
          Add line item
        </SubmitButton>
      </div>
    </form>
  );
}
