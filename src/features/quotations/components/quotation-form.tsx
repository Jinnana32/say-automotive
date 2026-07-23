"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { CatalogCombobox } from "@/components/shared/catalog-combobox";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuotationAction, reviseQuotationAction, updateQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { serializeQuotationItems } from "@/features/quotations/schemas/quotation-form-schema";
import { QuickCreateServiceDialog } from "@/features/services/components/quick-create-service-dialog";
import { QuotationTotalsFields } from "@/features/quotations/components/quotation-totals-fields";
import type {
  QuotationFormItem,
  QuotationFormOptions,
  QuotationFormValues,
} from "@/features/quotations/types";
import {
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  calculateQuotationTotals,
  createQuotationItem,
  dedupeOptionsById,
  inferQuotationTaxRate,
  mergeQuotationPartiesIntoFormOptions,
  type QuotationDiscountMode,
} from "@/features/quotations/utils";
import {
  formatCurrencyNumber,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
} from "@/lib/currency";
import { mapProductOptionsToCatalog, mapServiceOptionsToCatalog } from "@/lib/catalog/combobox-options";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function QuotationForm({
  mode,
  initialValues,
  options,
  lockedCustomerLabel,
  lockedVehicleLabel,
  partyContext,
}: {
  mode: "create" | "edit" | "revise";
  initialValues: QuotationFormValues;
  options: QuotationFormOptions;
  lockedCustomerLabel?: string;
  lockedVehicleLabel?: string;
  partyContext?: {
    customerName: string;
    vehicleLabel: string;
  };
}) {
  const formAction =
    mode === "create"
      ? createQuotationAction
      : mode === "revise"
        ? reviseQuotationAction
        : updateQuotationAction;
  const [state, formActionState] = useActionState(formAction, INITIAL_FORM_ACTION_STATE);
  const isRevise = mode === "revise";
  const [customerId, setCustomerId] = useState(initialValues.customerId);
  const [vehicleId, setVehicleId] = useState(initialValues.vehicleId);
  const [status, setStatus] = useState(initialValues.status);
  const [natureOfRepair, setNatureOfRepair] = useState(initialValues.natureOfRepair);
  const [inspectionNotes, setInspectionNotes] = useState(initialValues.inspectionNotes);
  const [discount, setDiscount] = useState(initialValues.discount);
  const [discountMode, setDiscountMode] = useState<QuotationDiscountMode>("fixed");
  const [taxRate, setTaxRate] = useState(() =>
    String(
      inferQuotationTaxRate({
        subtotal: calculateQuotationSubtotal(initialValues.items),
        discountAmount: Number(initialValues.discount || 0),
        taxAmount: Number(initialValues.tax || 0),
        defaultTaxRate: options.defaultTaxRate,
      }),
    ),
  );
  const customerOptions = dedupeOptionsById(options.customers);
  const vehicleOptions = dedupeOptionsById(options.vehicles);
  const resolvedPartyLabels = {
    customerName:
      lockedCustomerLabel ??
      partyContext?.customerName ??
      (initialValues.customerId ? "Selected customer" : ""),
    vehicleLabel:
      lockedVehicleLabel ??
      partyContext?.vehicleLabel ??
      (initialValues.vehicleId ? "Selected vehicle" : ""),
  };
  const resolvedCustomerOptions = useMemo(
    () =>
      initialValues.customerId
        ? mergeQuotationPartiesIntoFormOptions(
            { customers: customerOptions, vehicles: [] },
            {
              customerId: initialValues.customerId,
              customerName: resolvedPartyLabels.customerName,
              vehicleId: initialValues.vehicleId,
              vehicleLabel: resolvedPartyLabels.vehicleLabel,
            },
          ).customers
        : customerOptions,
    [customerOptions, initialValues.customerId, initialValues.vehicleId, resolvedPartyLabels.customerName, resolvedPartyLabels.vehicleLabel],
  );
  const availableVehicles = useMemo(
    () =>
      initialValues.vehicleId
        ? mergeQuotationPartiesIntoFormOptions(
            {
              customers: [],
              vehicles: vehicleOptions.filter((vehicle) => vehicle.customerId === customerId),
            },
            {
              customerId,
              customerName: resolvedPartyLabels.customerName,
              vehicleId: initialValues.vehicleId,
              vehicleLabel: resolvedPartyLabels.vehicleLabel,
            },
          ).vehicles
        : vehicleOptions.filter((vehicle) => vehicle.customerId === customerId),
    [
      vehicleOptions,
      customerId,
      initialValues.vehicleId,
      resolvedPartyLabels.customerName,
      resolvedPartyLabels.vehicleLabel,
    ],
  );
  const [items, setItems] = useState<QuotationFormItem[]>(
    initialValues.items.length > 0 ? initialValues.items : [createQuotationItem()],
  );
  const [productOptions, setProductOptions] = useState(() =>
    dedupeOptionsById(options.products),
  );
  const [serviceOptions, setServiceOptions] = useState(() =>
    dedupeOptionsById(options.services),
  );

  const { subtotal, discountAmount, taxAmount, grandTotal } = calculateQuotationTotals({
    items,
    discount,
    discountMode,
    taxRate,
  });

  return (
    <form action={formActionState} className="space-y-6">
      {initialValues.quotationId ? (
        <input type="hidden" name="quotationId" value={initialValues.quotationId} />
      ) : null}

      {isRevise ? (
        <>
          <input type="hidden" name="customerId" value={initialValues.customerId} />
          <input type="hidden" name="vehicleId" value={initialValues.vehicleId} />
        </>
      ) : null}

      <input type="hidden" name="itemsJson" value={serializeQuotationItems(items)} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>
                {mode === "create"
                  ? "Quotation details"
                  : mode === "revise"
                    ? "Revise quotation"
                    : "Edit quotation"}
              </CardTitle>
              <CardDescription>
                {mode === "revise"
                  ? "Updates save to both the customer quotation and the linked job order. Discount and tax apply to the quotation document; final invoice amounts may differ."
                  : "Quotations are estimates only. They should not touch inventory until approval and later job-order usage."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormRequiredFieldsNote />
              <FormStatusMessage message={state.message} />

              <div className="grid gap-6 md:grid-cols-2">
                {isRevise ? (
                  <>
                    <div className="space-y-2">
                      <Label required>Customer</Label>
                      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground">
                        {lockedCustomerLabel ?? "Unknown customer"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label required>Vehicle</Label>
                      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground">
                        {lockedVehicleLabel ?? "Unknown vehicle"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                        {resolvedCustomerOptions.map((customer) => (
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
                  </>
                )}
              </div>

              {!isRevise ? (
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
              ) : null}

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
            <CardHeader>
              <CardTitle>Quotation items</CardTitle>
              <CardDescription>
                Products and services can be catalog-driven. Labor can stay manual when needed.
              </CardDescription>
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
                          <Label required>Product</Label>
                          <CatalogCombobox
                            id={`product-${item.key}`}
                            value={item.productId}
                            options={mapProductOptionsToCatalog(filteredProducts)}
                            placeholder="Search products"
                            emptyMessage="No matching products found."
                            inputClassName={fieldControlClassName(state.fieldErrors, "items")}
                            inputProps={fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                            onValueChange={(nextProductId) => {
                              if (!nextProductId) {
                                updateItem(setItems, item.key, {
                                  productId: "",
                                  serviceId: "",
                                  description: "",
                                  unitPrice: formatMoneyInputValue(0),
                                });
                                return;
                              }

                              const selected = filteredProducts.find((product) => product.id === nextProductId);
                              updateItem(setItems, item.key, {
                                productId: nextProductId,
                                serviceId: "",
                                description: selected?.label ?? "",
                                unitPrice: selected
                                  ? formatMoneyInputValue(selected.unitPrice)
                                  : formatMoneyInputValue(0),
                              });
                            }}
                            onSelect={(selected) => {
                              updateItem(setItems, item.key, {
                                productId: selected.id,
                                serviceId: "",
                                description: selected.label,
                                unitPrice: formatMoneyInputValue(selected.price ?? 0),
                              });
                            }}
                            createAction={
                              options.permissions.canCreateProducts
                                ? {
                                    label: "Create New Product",
                                    renderDialog: ({ open, onOpenChange }) => (
                                      <QuickCreateProductDialog
                                        open={open}
                                        onOpenChange={onOpenChange}
                                        showTrigger={false}
                                        initialOptions={options.productFormOptions ?? undefined}
                                        onCreated={(product) => {
                                          setProductOptions((current) => {
                                            const nextProduct = {
                                              id: product.id,
                                              label: product.label,
                                              sku: product.sku,
                                              unitPrice: product.unitPrice,
                                            };

                                            return dedupeOptionsById([...current, nextProduct]);
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
                                    ),
                                  }
                                : undefined
                            }
                          />
                        </div>
                      ) : item.itemType === "service" ? (
                        <div className="space-y-2 xl:col-span-2">
                          <Label required>Service</Label>
                          <CatalogCombobox
                            id={`service-${item.key}`}
                            value={item.serviceId}
                            options={mapServiceOptionsToCatalog(filteredServices)}
                            placeholder="Search services"
                            emptyMessage="No matching services found."
                            inputClassName={fieldControlClassName(state.fieldErrors, "items")}
                            inputProps={fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
                              required: true,
                              errorId: fieldErrorId("items"),
                            })}
                            onValueChange={(nextServiceId) => {
                              if (!nextServiceId) {
                                updateItem(setItems, item.key, {
                                  productId: "",
                                  serviceId: "",
                                  description: "",
                                  unitPrice: formatMoneyInputValue(0),
                                });
                                return;
                              }

                              const selected = filteredServices.find((service) => service.id === nextServiceId);
                              updateItem(setItems, item.key, {
                                serviceId: nextServiceId,
                                productId: "",
                                description: selected?.label ?? "",
                                unitPrice: selected
                                  ? formatMoneyInputValue(selected.unitPrice)
                                  : formatMoneyInputValue(0),
                              });
                            }}
                            onSelect={(selected) => {
                              updateItem(setItems, item.key, {
                                serviceId: selected.id,
                                productId: "",
                                description: selected.label,
                                unitPrice: formatMoneyInputValue(selected.price ?? 0),
                              });
                            }}
                            createAction={
                              options.permissions.canCreateServices
                                ? {
                                    label: "Create New Service",
                                    renderDialog: ({ open, onOpenChange }) => (
                                      <QuickCreateServiceDialog
                                        open={open}
                                        onOpenChange={onOpenChange}
                                        showTrigger={false}
                                        onCreated={(service) => {
                                          setServiceOptions((current) => {
                                            const nextService = {
                                              id: service.id,
                                              label: service.label,
                                              category: service.category,
                                              unitPrice: service.unitPrice,
                                            };

                                            return dedupeOptionsById([...current, nextService]);
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
                                    ),
                                  }
                                : undefined
                            }
                          />
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
                          <Label optional>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(setItems, item.key, { description: event.target.value })
                            }
                            placeholder="Optional override for the catalog item name"
                            className={fieldControlClassName(state.fieldErrors, "items")}
                            {...fieldAriaProps({
                              errors: state.fieldErrors,
                              name: "items",
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
              <input type="hidden" name="discount" value={formatMoneyInputValue(discountAmount)} />
              <input type="hidden" name="tax" value={formatMoneyInputValue(taxAmount)} />

              <QuotationTotalsFields
                subtotal={subtotal}
                discount={discount}
                discountMode={discountMode}
                taxRate={taxRate}
                defaultTaxRate={options.defaultTaxRate}
                fieldErrors={state.fieldErrors}
                onDiscountChange={setDiscount}
                onDiscountModeChange={setDiscountMode}
                onTaxRateChange={setTaxRate}
              />

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span>Subtotal</span>
                  <span>{formatCurrencyNumber(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Discount</span>
                  <span>{formatCurrencyNumber(discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Tax ({taxRate || "0"}%)</span>
                  <span>{formatCurrencyNumber(taxAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>Total estimate</span>
                  <span>{formatCurrencyNumber(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <SubmitButton
                  pendingLabel={
                    mode === "create" ? "Saving..." : mode === "revise" ? "Revising..." : "Updating..."
                  }
                >
                  {mode === "create"
                    ? "Save quotation"
                    : mode === "revise"
                      ? "Save revised quotation"
                      : "Save changes"}
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
