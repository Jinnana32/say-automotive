"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { AddEntryButton } from "@/components/shared/add-entry-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuotationAction, updateQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { serializeQuotationItems } from "@/features/quotations/schemas/quotation-form-schema";
import { QuickCreateServiceDialog } from "@/features/services/components/quick-create-service-dialog";
import type {
  QuotationFormItem,
  QuotationFormOptions,
  QuotationFormValues,
} from "@/features/quotations/types";
import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
  dedupeOptionsById,
} from "@/features/quotations/utils";
import {
  formatCurrencyNumber,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
} from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function QuotationForm({
  mode,
  initialValues,
  options,
}: {
  mode: "create" | "edit";
  initialValues: QuotationFormValues;
  options: QuotationFormOptions;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createQuotationAction : updateQuotationAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [customerId, setCustomerId] = useState(initialValues.customerId);
  const [vehicleId, setVehicleId] = useState(initialValues.vehicleId);
  const [status, setStatus] = useState(initialValues.status);
  const [natureOfRepair, setNatureOfRepair] = useState(initialValues.natureOfRepair);
  const [inspectionNotes, setInspectionNotes] = useState(initialValues.inspectionNotes);
  const [discount, setDiscount] = useState(initialValues.discount);
  const [tax, setTax] = useState(initialValues.tax);
  const customerOptions = dedupeOptionsById(options.customers);
  const vehicleOptions = dedupeOptionsById(options.vehicles);
  const [items, setItems] = useState<QuotationFormItem[]>(
    initialValues.items.length > 0 ? initialValues.items : [createQuotationItem()],
  );
  const [productOptions, setProductOptions] = useState(() =>
    dedupeOptionsById(options.products),
  );
  const [serviceOptions, setServiceOptions] = useState(() =>
    dedupeOptionsById(options.services),
  );

  const availableVehicles = vehicleOptions.filter((vehicle) => vehicle.customerId === customerId);
  const subtotal = calculateQuotationSubtotal(items);
  const grandTotal = calculateQuotationGrandTotal({ items, discount, tax });

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.quotationId ? (
        <input type="hidden" name="quotationId" value={initialValues.quotationId} />
      ) : null}

      <input type="hidden" name="itemsJson" value={serializeQuotationItems(items)} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{mode === "create" ? "Quotation details" : "Edit quotation"}</CardTitle>
              <CardDescription>
                Quotations are estimates only. They should not touch inventory until approval and
                later job-order usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormRequiredFieldsNote />
              <FormStatusMessage message={state.message} />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerId" required>
                    Customer
                  </Label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={customerId}
                    onChange={(event) => {
                      const nextCustomerId = event.target.value;
                      const nextAvailableVehicles = vehicleOptions.filter(
                        (vehicle) => vehicle.customerId === nextCustomerId,
                      );

                      setCustomerId(nextCustomerId);

                      if (!nextAvailableVehicles.some((vehicle) => vehicle.id === vehicleId)) {
                        setVehicleId("");
                      }
                    }}
                    className={formSelectClassName(state.fieldErrors, "customerId")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "customerId",
                      required: true,
                      errorId: fieldErrorId("customerId"),
                    })}
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="customerId" id={fieldErrorId("customerId")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleId" required>
                    Vehicle
                  </Label>
                  <select
                    id="vehicleId"
                    name="vehicleId"
                    value={vehicleId}
                    onChange={(event) => setVehicleId(event.target.value)}
                    className={formSelectClassName(state.fieldErrors, "vehicleId")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "vehicleId",
                      required: true,
                      errorId: fieldErrorId("vehicleId"),
                    })}
                  >
                    <option value="">Select vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="vehicleId" id={fieldErrorId("vehicleId")} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status" required>
                    Quotation status
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as QuotationFormValues["status"])}
                    className={formSelectClassName(state.fieldErrors, "status")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "status",
                      required: true,
                      errorId: fieldErrorId("status"),
                    })}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending approval</option>
                  </select>
                  <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="natureOfRepair" optional>
                    Nature of repair
                  </Label>
                  <Textarea
                    id="natureOfRepair"
                    name="natureOfRepair"
                    value={natureOfRepair}
                    className={fieldControlClassName(state.fieldErrors, "natureOfRepair")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "natureOfRepair",
                      required: false,
                      errorId: fieldErrorId("natureOfRepair"),
                    })}
                    onChange={(event) => setNatureOfRepair(event.target.value)}
                  />
                  <FieldError errors={state.fieldErrors} name="natureOfRepair" id={fieldErrorId("natureOfRepair")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspectionNotes" optional>
                    Inspection notes
                  </Label>
                  <Textarea
                    id="inspectionNotes"
                    name="inspectionNotes"
                    value={inspectionNotes}
                    className={fieldControlClassName(state.fieldErrors, "inspectionNotes")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "inspectionNotes",
                      required: false,
                      errorId: fieldErrorId("inspectionNotes"),
                    })}
                    onChange={(event) => setInspectionNotes(event.target.value)}
                  />
                  <FieldError errors={state.fieldErrors} name="inspectionNotes" id={fieldErrorId("inspectionNotes")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Quotation items</CardTitle>
                <CardDescription>
                  Products and services can be catalog-driven. Labor can stay manual when needed.
                </CardDescription>
              </div>
              <AddEntryButton onClick={() => setItems((current) => [...current, createQuotationItem()])}>
                Add line item
              </AddEntryButton>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
                const lineTotal = calculateQuotationLineTotal(item);
                const filteredProducts = productOptions;
                const filteredServices = serviceOptions;

                return (
                  <div key={item.key} className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold">Line {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setItems((current) => current.length > 1 ? current.filter((entry) => entry.key !== item.key) : current)
                        }
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="space-y-2">
                        <Label required>Item type</Label>
                        <select
                          value={item.itemType}
                          onChange={(event) =>
                            updateItem(setItems, item.key, {
                              itemType: event.target.value as QuotationFormItem["itemType"],
                              productId: "",
                              serviceId: "",
                              description: "",
                              unitPrice: formatMoneyInputValue(0),
                            })
                          }
                          className={formSelectClassName(state.fieldErrors, "items")}
                          {...fieldAriaProps({
                            errors: state.fieldErrors,
                            name: "items",
                            required: true,
                            errorId: fieldErrorId("items"),
                          })}
                        >
                          <option value="product">Product</option>
                          <option value="service">Service</option>
                          <option value="labor">Manual labor</option>
                        </select>
                      </div>

                      {item.itemType === "product" ? (
                        <div className="space-y-2 xl:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label required>Product</Label>
                            {options.permissions.canCreateProducts ? (
                              <QuickCreateProductDialog
                                triggerLabel="Add new product"
                                initialOptions={options.productFormOptions ?? undefined}
                                onCreated={(product) => {
                                  setProductOptions((current) => {
                                    const nextProduct = {
                                      id: product.id,
                                      label: product.label,
                                      sku: product.sku,
                                      unitPrice: product.unitPrice,
                                    };

                                    return dedupeOptionsById([
                                      ...current,
                                      nextProduct,
                                    ]);
                                  });
                                  updateItem(setItems, item.key, {
                                    itemType: "product",
                                    productId: product.id,
                                    serviceId: "",
                                    description: product.label,
                                    unitPrice: formatMoneyInputValue(product.unitPrice),
                                  });
                                }}
                              />
                            ) : null}
                          </div>
                          <select
                            value={item.productId}
                            onChange={(event) => {
                              const selected = filteredProducts.find((product) => product.id === event.target.value);
                              updateItem(setItems, item.key, {
                                productId: event.target.value,
                                serviceId: "",
                                description: selected?.label ?? "",
                                unitPrice: selected ? formatMoneyInputValue(selected.unitPrice) : formatMoneyInputValue(0),
                              });
                            }}
                            className={formSelectClassName(state.fieldErrors, "items")}
                            {...fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                          >
                            <option value="">Select product</option>
                            {filteredProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.label}
                                {product.sku ? ` (${product.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : item.itemType === "service" ? (
                        <div className="space-y-2 xl:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label required>Service</Label>
                            {options.permissions.canCreateServices ? (
                              <QuickCreateServiceDialog
                                triggerLabel="Add new service"
                                onCreated={(service) => {
                                  setServiceOptions((current) => {
                                    const nextService = {
                                      id: service.id,
                                      label: service.label,
                                      category: service.category,
                                      unitPrice: service.unitPrice,
                                    };

                                    return dedupeOptionsById([
                                      ...current,
                                      nextService,
                                    ]);
                                  });
                                  updateItem(setItems, item.key, {
                                    itemType: "service",
                                    serviceId: service.id,
                                    productId: "",
                                    description: service.label,
                                    unitPrice: formatMoneyInputValue(service.unitPrice),
                                  });
                                }}
                              />
                            ) : null}
                          </div>
                          <select
                            value={item.serviceId}
                            onChange={(event) => {
                              const selected = filteredServices.find((service) => service.id === event.target.value);
                              updateItem(setItems, item.key, {
                                serviceId: event.target.value,
                                productId: "",
                                description: selected?.label ?? "",
                                unitPrice: selected ? formatMoneyInputValue(selected.unitPrice) : formatMoneyInputValue(0),
                              });
                            }}
                            className={formSelectClassName(state.fieldErrors, "items")}
                            {...fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                          >
                            <option value="">Select service</option>
                            {filteredServices.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.label}
                                {service.category ? ` (${service.category})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2 xl:col-span-2">
                          <Label required>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(setItems, item.key, { description: event.target.value })
                            }
                            placeholder="Manual labor description"
                            className={fieldControlClassName(state.fieldErrors, "items")}
                            {...fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                          />
                        </div>
                      )}

                      {item.itemType !== "labor" ? (
                        <div className="space-y-2 xl:col-span-2">
                          <Label required>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(setItems, item.key, { description: event.target.value })
                            }
                            placeholder="Description"
                            className={fieldControlClassName(state.fieldErrors, "items")}
                            {...fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label required>Quantity</Label>
                        <Input
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(setItems, item.key, { quantity: event.target.value })
                          }
                          className={fieldControlClassName(state.fieldErrors, "items")}
                          {...fieldAriaProps({
                            errors: state.fieldErrors,
                            name: "items",
                            required: true,
                            errorId: fieldErrorId("items"),
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label required>Unit price</Label>
                        <Input
                          inputMode="decimal"
                          type="number"
                          step={MONEY_INPUT_STEP}
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(setItems, item.key, { unitPrice: event.target.value })
                          }
                          className={fieldControlClassName(state.fieldErrors, "items")}
                          {...fieldAriaProps({
                            errors: state.fieldErrors,
                            name: "items",
                            required: true,
                            errorId: fieldErrorId("items"),
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Line total</Label>
                        <div className="flex h-11 items-center rounded-xl border border-input bg-background px-3 text-sm font-medium">
                          {formatCurrencyNumber(lineTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <AddEntryButton
                className="w-full sm:w-auto"
                onClick={() => setItems((current) => [...current, createQuotationItem()])}
              >
                Add another line item
              </AddEntryButton>

              <FieldError errors={state.fieldErrors} name="items" id={fieldErrorId("items")} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Totals</CardTitle>
              <CardDescription>Totals are estimates only until work is approved and executed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount" required>
                  Discount
                </Label>
                <Input
                  id="discount"
                  name="discount"
                  inputMode="decimal"
                  type="number"
                  step={MONEY_INPUT_STEP}
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className={fieldControlClassName(state.fieldErrors, "discount")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "discount",
                    required: true,
                    errorId: fieldErrorId("discount"),
                  })}
                />
                <FieldError errors={state.fieldErrors} name="discount" id={fieldErrorId("discount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax" required>
                  Tax
                </Label>
                <Input
                  id="tax"
                  name="tax"
                  inputMode="decimal"
                  type="number"
                  step={MONEY_INPUT_STEP}
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                  className={fieldControlClassName(state.fieldErrors, "tax")}
                  {...fieldAriaProps({
                    errors: state.fieldErrors,
                    name: "tax",
                    required: true,
                    errorId: fieldErrorId("tax"),
                  })}
                />
                <FieldError errors={state.fieldErrors} name="tax" id={fieldErrorId("tax")} />
              </div>

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span>Subtotal</span>
                  <span>{formatCurrencyNumber(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Discount</span>
                  <span>{formatCurrencyNumber(Number(discount || 0))}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Tax</span>
                  <span>{formatCurrencyNumber(Number(tax || 0))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>Total estimate</span>
                  <span>{formatCurrencyNumber(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <SubmitButton pendingLabel={mode === "create" ? "Saving..." : "Updating..."}>
                  {mode === "create" ? "Save quotation" : "Save changes"}
                </SubmitButton>
                <Button asChild variant="outline" type="button">
                  <Link href={mode === "create" ? "/quotations" : `/quotations/${initialValues.quotationId}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function updateItem(
  setItems: React.Dispatch<React.SetStateAction<QuotationFormItem[]>>,
  key: string,
  patch: Partial<QuotationFormItem>,
) {
  setItems((current) =>
    current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
  );
}
