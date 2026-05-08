"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { StepProgress, type StepProgressStatus } from "@/components/shared/step-progress";
import { SubmitButton } from "@/components/shared/submit-button";
import { TextAutocomplete } from "@/components/shared/text-autocomplete";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  quickCreateCustomerForQuotationAction,
  quickCreateVehicleForQuotationAction,
  type QuotationQuickCustomerActionState,
  type QuotationQuickVehicleActionState,
} from "@/features/quotations/actions/quotation-create-flow-actions";
import { createQuotationAction } from "@/features/quotations/actions/quotation-actions";
import { serializeQuotationItems } from "@/features/quotations/schemas/quotation-form-schema";
import type {
  QuotationCreateFlowOptions,
  QuotationFormItem,
  QuotationFormValues,
  QuotationVehicleOption,
} from "@/features/quotations/types";
import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
  toNumeric,
} from "@/features/quotations/utils";
import type { CustomerFormValues, CustomerOption } from "@/features/customers/types";
import type { VehicleFormLookupData, VehicleFormValues } from "@/features/vehicles/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { cn } from "@/lib/utils";

type QuotationCreateStep = "customer" | "vehicle" | "items" | "review" | "summary";
type IntakeSelectionMode = "choose" | "existing" | "new";

const STEP_ORDER: QuotationCreateStep[] = ["customer", "vehicle", "items", "review", "summary"];
const INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE = {
  status: "idle",
} as const;

export function QuotationCreateFlow({
  options,
  initialValues,
}: {
  options: QuotationCreateFlowOptions;
  initialValues: QuotationFormValues;
}) {
  const [quotationState, quotationFormAction] = useActionState(
    createQuotationAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [customerOptions, setCustomerOptions] = useState(options.customers);
  const [vehicleOptions, setVehicleOptions] = useState(options.vehicles);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMode, setCustomerMode] = useState<IntakeSelectionMode>("choose");
  const [vehicleMode, setVehicleMode] = useState<IntakeSelectionMode>("choose");
  const { values, setValues, updateFormValue } = useFormValues(initialValues);
  const [currentStep, setCurrentStep] = useState<QuotationCreateStep>(deriveCreateStep(initialValues));

  const selectedCustomer = customerOptions.find((customer) => customer.id === values.customerId) ?? null;
  const selectedVehicle = vehicleOptions.find((vehicle) => vehicle.id === values.vehicleId) ?? null;
  const availableVehicles = vehicleOptions.filter((vehicle) => vehicle.customerId === values.customerId);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = customerSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return customerOptions;
    }

    return customerOptions.filter((customer) =>
      customer.label.trim().toLowerCase().includes(normalizedQuery),
    );
  }, [customerOptions, customerSearch]);

  const subtotal = calculateQuotationSubtotal(values.items);
  const grandTotal = calculateQuotationGrandTotal({
    items: values.items,
    discount: values.discount,
    tax: values.tax,
  });
  const canReview = isQuotationDraftReady(values);

  return (
    <div className="space-y-6">
      <StepProgress
        items={STEP_ORDER.map((step, index) => ({
          key: step,
          stepLabel: `Step ${index + 1}`,
          title: STEP_LABELS[step],
          status: getStepStatus(step, currentStep, values),
        }))}
      />

      {currentStep === "customer" ? (
          <SectionCard
            title="Step 1. Choose the customer"
            description="Decide whether this quotation should use an existing customer record or capture a brand-new one now."
          >
            <div className="space-y-5">
              {customerMode === "choose" ? (
                <>
                  <IntakeChoiceGrid
                    existingLabel="Use existing customer"
                    existingDescription="Search and attach a customer record that already exists in the system."
                    newLabel="Enter a new one"
                    newDescription="Create the customer inline here and continue quotation intake without leaving the flow."
                    existingDisabled={customerOptions.length === 0}
                    onChooseExisting={() => setCustomerMode("existing")}
                    onChooseNew={() => {
                      setCustomerMode("new");
                      updateFormValue("customerId", "");
                      updateFormValue("vehicleId", "");
                      setVehicleMode("choose");
                      setCustomerSearch("");
                    }}
                  />

                  {selectedCustomer ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                            Current selection
                          </p>
                          <p className="font-semibold text-foreground">{selectedCustomer.label}</p>
                          <p className="text-sm text-muted-foreground">
                            This customer will be used for the quotation unless you change the path.
                          </p>
                        </div>
                        <Button type="button" onClick={() => setCurrentStep("vehicle")}>
                          Continue to vehicle
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {customerMode === "existing" ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Use existing customer</p>
                      <p className="text-xs text-muted-foreground">
                        Search and select the customer record to continue the quotation.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setCustomerMode("choose")}>
                      Back to choices
                    </Button>
                  </div>

                  <SearchInput
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Search existing customers"
                  />

                  {filteredCustomers.length === 0 ? (
                    <EmptyState
                      title="No matching customers"
                      description="Try another search or switch to entering a new customer directly in this flow."
                      action={
                        <Button type="button" variant="outline" onClick={() => setCustomerMode("new")}>
                          Enter a new customer
                        </Button>
                      }
                    />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredCustomers.map((customer) => {
                        const isSelected = values.customerId === customer.id;

                        return (
                          <button
                            key={customer.id}
                            type="button"
                            className={cn(
                              "rounded-2xl border px-4 py-4 text-left transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:bg-muted/35",
                            )}
                            onClick={() => {
                              const nextAvailableVehicles = vehicleOptions.filter(
                                (vehicle) => vehicle.customerId === customer.id,
                              );

                              updateFormValue("customerId", customer.id);
                              if (!nextAvailableVehicles.some((vehicle) => vehicle.id === values.vehicleId)) {
                                updateFormValue("vehicleId", "");
                              }
                              setVehicleMode("choose");
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">{customer.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Use this customer for the quotation and downstream job order.
                                </p>
                              </div>
                              {isSelected ? <StatusBadge tone="info">Selected</StatusBadge> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep("vehicle")}
                      disabled={!values.customerId}
                    >
                      Continue to vehicle
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </>
              ) : null}

              {customerMode === "new" ? (
                <QuickCustomerCreateForm
                  onBack={() => setCustomerMode("choose")}
                  onCreated={(customer) => {
                    setCustomerOptions((current) => sortCustomers([...current, customer]));
                    updateFormValue("customerId", customer.id);
                    updateFormValue("vehicleId", "");
                    setCustomerMode("choose");
                    setVehicleMode("choose");
                    setCurrentStep("vehicle");
                    setCustomerSearch("");
                  }}
                />
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        {currentStep === "vehicle" ? (
          <SectionCard
            title="Step 2. Choose the vehicle"
            description={
              selectedCustomer
                ? `Working under ${selectedCustomer.label}. Choose whether to use an existing vehicle or capture a new one now.`
                : "Choose the customer first."
            }
          >
            <div className="space-y-5">
              {!selectedCustomer ? (
                <EmptyState
                  title="Customer is required first"
                  description="Choose the customer before selecting a vehicle so the quotation stays linked correctly."
                  action={
                    <Button type="button" variant="outline" onClick={() => setCurrentStep("customer")}>
                      Back to customer
                    </Button>
                  }
                />
              ) : (
                <>
                  {vehicleMode === "choose" ? (
                    <>
                      <IntakeChoiceGrid
                        existingLabel="Use existing vehicle"
                        existingDescription="Pick from the vehicles already linked to this customer."
                        newLabel="Enter a new one"
                        newDescription="Add the vehicle here, attach it to the customer, and continue without leaving intake."
                        existingDisabled={availableVehicles.length === 0}
                        onChooseExisting={() => setVehicleMode("existing")}
                        onChooseNew={() => {
                          setVehicleMode("new");
                          updateFormValue("vehicleId", "");
                        }}
                      />

                      {selectedVehicle ? (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                                Current selection
                              </p>
                              <p className="font-semibold text-foreground">{selectedVehicle.label}</p>
                              <p className="text-sm text-muted-foreground">
                                This vehicle is ready to be used for the quotation.
                              </p>
                            </div>
                            <Button type="button" onClick={() => setCurrentStep("items")}>
                              Continue to quotation
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {vehicleMode === "existing" ? (
                    availableVehicles.length === 0 ? (
                      <EmptyState
                        title="No vehicles for this customer yet"
                        description="Switch to entering a new vehicle so the quotation can continue inside intake."
                        action={
                          <Button type="button" variant="outline" onClick={() => setVehicleMode("new")}>
                            Enter a new vehicle
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Use existing vehicle</p>
                            <p className="text-xs text-muted-foreground">
                              Select one of the customer&apos;s existing vehicles.
                            </p>
                          </div>
                          <Button type="button" variant="outline" onClick={() => setVehicleMode("choose")}>
                            Back to choices
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {availableVehicles.map((vehicle) => {
                            const isSelected = values.vehicleId === vehicle.id;

                            return (
                              <button
                                key={vehicle.id}
                                type="button"
                                className={cn(
                                  "rounded-2xl border px-4 py-4 text-left transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:bg-muted/35",
                                )}
                                onClick={() => updateFormValue("vehicleId", vehicle.id)}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-foreground">{vehicle.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Use this vehicle for the quotation and later service history.
                                    </p>
                                  </div>
                                  {isSelected ? <StatusBadge tone="info">Selected</StatusBadge> : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )
                  ) : null}

                  {vehicleMode === "new" ? (
                    <QuickVehicleCreateForm
                      customerId={selectedCustomer.id}
                      customerLabel={selectedCustomer.label}
                      lookupData={options.vehicleLookups}
                      onBack={() => setVehicleMode("choose")}
                      onCreated={(vehicle) => {
                        setVehicleOptions((current) => sortVehicles([...current, vehicle]));
                        updateFormValue("vehicleId", vehicle.id);
                        setVehicleMode("choose");
                        setCurrentStep("items");
                      }}
                    />
                  ) : null}
                </>
              )}

              <div className="flex flex-wrap justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep("customer")}>
                  Back to customer
                </Button>
                {vehicleMode === "existing" ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("items")}
                    disabled={!values.vehicleId}
                  >
                    Continue to quotation
                    <ChevronRight className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </SectionCard>
        ) : null}

        {currentStep === "items" || currentStep === "review" || currentStep === "summary" ? (
          <form action={quotationFormAction} className="space-y-6">
            <input type="hidden" name="customerId" value={values.customerId} />
            <input type="hidden" name="vehicleId" value={values.vehicleId} />
            <input type="hidden" name="natureOfRepair" value={values.natureOfRepair} />
            <input type="hidden" name="status" value={values.status} />
            <input type="hidden" name="inspectionNotes" value={values.inspectionNotes} />
            <input type="hidden" name="discount" value={values.discount} />
            <input type="hidden" name="tax" value={values.tax} />
            <input type="hidden" name="itemsJson" value={serializeQuotationItems(values.items)} />

            {currentStep === "items" ? (
              <>
                <SectionCard
                  title="Step 3. Build the quotation"
                  description="Add products, services, and manual labor. Quotations remain estimates only and do not deduct stock."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          items: [...current.items, createQuotationItem()],
                        }))
                      }
                    >
                      <Plus className="size-4" />
                      Add item
                    </Button>
                  }
                >
                  <div className="space-y-5">
                    <FormStatusMessage message={quotationState.message} />

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                      <div className="space-y-2">
                        <Label htmlFor="natureOfRepair">Nature of repair</Label>
                        <Textarea
                          id="natureOfRepair"
                          value={values.natureOfRepair}
                          onChange={(event) => updateFormValue("natureOfRepair", event.target.value)}
                          placeholder="Printed customer-facing repair scope or requested job."
                        />
                        <FieldError errors={quotationState.fieldErrors} name="natureOfRepair" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inspectionNotes">Inspection notes</Label>
                        <Textarea
                          id="inspectionNotes"
                          value={values.inspectionNotes}
                          onChange={(event) => updateFormValue("inspectionNotes", event.target.value)}
                          placeholder="Visible workshop findings, customer concerns, or intake notes."
                        />
                        <FieldError errors={quotationState.fieldErrors} name="inspectionNotes" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quotationStatus">Quotation status</Label>
                        <NativeSelect
                          id="quotationStatus"
                          value={values.status}
                          onChange={(event) =>
                            updateFormValue(
                              "status",
                              event.target.value as QuotationFormValues["status"],
                            )
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_approval">Pending approval</option>
                        </NativeSelect>
                        <FieldError errors={quotationState.fieldErrors} name="status" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {values.items.map((item, index) => {
                        const lineTotal = calculateQuotationLineTotal(item);

                        return (
                          <div key={item.key} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">Line {index + 1}</p>
                                <p className="text-xs text-muted-foreground">
                                  Capture the actual quoted product, service, or manual labor line.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={values.items.length === 1}
                                onClick={() =>
                                  setValues((current) => ({
                                    ...current,
                                    items:
                                      current.items.length > 1
                                        ? current.items.filter((entry) => entry.key !== item.key)
                                        : current.items,
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                              <div className="space-y-2">
                                <Label>Item type</Label>
                                <NativeSelect
                                  value={item.itemType}
                                  onChange={(event) =>
                                    updateQuotationItem(setValues, item.key, {
                                      itemType: event.target.value as QuotationFormItem["itemType"],
                                      productId: "",
                                      serviceId: "",
                                      description: "",
                                      unitPrice: "0",
                                    })
                                  }
                                >
                                  <option value="product">Product</option>
                                  <option value="service">Service</option>
                                  <option value="labor">Manual labor</option>
                                </NativeSelect>
                              </div>

                              {item.itemType === "product" ? (
                                <div className="space-y-2 xl:col-span-2">
                                  <Label>Product</Label>
                                  <NativeSelect
                                    value={item.productId}
                                    onChange={(event) => {
                                      const selected = options.products.find(
                                        (product) => product.id === event.target.value,
                                      );

                                      updateQuotationItem(setValues, item.key, {
                                        productId: event.target.value,
                                        serviceId: "",
                                        description: selected?.label ?? "",
                                        unitPrice: selected ? String(selected.unitPrice) : "0",
                                      });
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
                                </div>
                              ) : item.itemType === "service" ? (
                                <div className="space-y-2 xl:col-span-2">
                                  <Label>Service</Label>
                                  <NativeSelect
                                    value={item.serviceId}
                                    onChange={(event) => {
                                      const selected = options.services.find(
                                        (service) => service.id === event.target.value,
                                      );

                                      updateQuotationItem(setValues, item.key, {
                                        serviceId: event.target.value,
                                        productId: "",
                                        description: selected?.label ?? "",
                                        unitPrice: selected ? String(selected.unitPrice) : "0",
                                      });
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
                                </div>
                              ) : (
                                <div className="space-y-2 xl:col-span-2">
                                  <Label>Description</Label>
                                  <Input
                                    value={item.description}
                                    onChange={(event) =>
                                      updateQuotationItem(setValues, item.key, {
                                        description: event.target.value,
                                      })
                                    }
                                    placeholder="Manual labor description"
                                  />
                                </div>
                              )}

                              {item.itemType !== "labor" ? (
                                <div className="space-y-2 xl:col-span-2">
                                  <Label>Description</Label>
                                  <Input
                                    value={item.description}
                                    onChange={(event) =>
                                      updateQuotationItem(setValues, item.key, {
                                        description: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  inputMode="decimal"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateQuotationItem(setValues, item.key, {
                                      quantity: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Unit price</Label>
                                <Input
                                  inputMode="decimal"
                                  value={item.unitPrice}
                                  onChange={(event) =>
                                    updateQuotationItem(setValues, item.key, {
                                      unitPrice: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Line total</Label>
                                <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm font-medium">
                                  {lineTotal.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <FieldError errors={quotationState.fieldErrors} name="items" />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Totals setup" description="Discount and tax remain editable until you finalize the quotation.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount</Label>
                      <Input
                        id="discount"
                        inputMode="decimal"
                        value={values.discount}
                        onChange={(event) => updateFormValue("discount", event.target.value)}
                      />
                      <FieldError errors={quotationState.fieldErrors} name="discount" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax">Tax</Label>
                      <Input
                        id="tax"
                        inputMode="decimal"
                        value={values.tax}
                        onChange={(event) => updateFormValue("tax", event.target.value)}
                      />
                      <FieldError errors={quotationState.fieldErrors} name="tax" />
                    </div>
                  </div>
                </SectionCard>

                <div className="flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep("vehicle")}>
                    Back to vehicle
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("review")}
                    disabled={!canReview}
                  >
                    Review quotation
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </>
            ) : currentStep === "review" ? (
              <>
                <SectionCard
                  title="Step 4. Review quotation details"
                  description="Check the selected customer, vehicle, and quoted line items before moving to the final summary."
                >
                  <div className="space-y-5">
                    <FormStatusMessage message={quotationState.message} />

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Customer
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {selectedCustomer?.label ?? "Not selected"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Vehicle
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {selectedVehicle?.label ?? "Not selected"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 md:col-span-2 xl:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Nature of repair
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {values.natureOfRepair || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20">
                      <div className="border-b border-border/70 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">Quoted items</p>
                      </div>
                      <div className="divide-y divide-border/60">
                        {values.items.map((item, index) => (
                          <div key={item.key} className="flex items-start justify-between gap-4 px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {index + 1}. {item.description || "Untitled line item"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.itemType} · qty {item.quantity || "0"} · unit {item.unitPrice || "0.00"}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {calculateQuotationLineTotal(item).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="reviewStatus">Quotation status</Label>
                        <NativeSelect
                          id="reviewStatus"
                          value={values.status}
                          onChange={(event) =>
                            updateFormValue(
                              "status",
                              event.target.value as QuotationFormValues["status"],
                            )
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_approval">Pending approval</option>
                        </NativeSelect>
                        <FieldError errors={quotationState.fieldErrors} name="status" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewDiscount">Discount</Label>
                        <Input
                          id="reviewDiscount"
                          inputMode="decimal"
                          value={values.discount}
                          onChange={(event) => updateFormValue("discount", event.target.value)}
                        />
                        <FieldError errors={quotationState.fieldErrors} name="discount" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewTax">Tax</Label>
                        <Input
                          id="reviewTax"
                          inputMode="decimal"
                          value={values.tax}
                          onChange={(event) => updateFormValue("tax", event.target.value)}
                        />
                        <FieldError errors={quotationState.fieldErrors} name="tax" />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Inspection notes
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          {values.inspectionNotes || "No inspection notes added."}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div className="flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep("items")}>
                    Back to items
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("summary")}
                    disabled={!canReview}
                  >
                    Continue to summary
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <SectionCard
                  title="Step 5. Final summary"
                  description="Confirm the commercial summary and save the quotation when everything looks correct."
                >
                  <div className="space-y-5">
                    <FormStatusMessage message={quotationState.message} />

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Customer
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {selectedCustomer?.label ?? "Not selected"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Vehicle
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {selectedVehicle?.label ?? "Not selected"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Status
                        </p>
                        <p className="mt-2 text-base font-semibold capitalize text-foreground">
                          {values.status.replace("_", " ")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Line items
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {values.items.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 md:col-span-2 lg:col-span-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Nature of repair
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {values.natureOfRepair || "Not provided"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {values.inspectionNotes || "No inspection notes added."}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                      <p className="text-sm font-semibold text-foreground">Confirmation summary</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <SummaryRow label="Customer ready" value={selectedCustomer ? "Yes" : "No"} />
                        <SummaryRow label="Vehicle ready" value={selectedVehicle ? "Yes" : "No"} />
                        <SummaryRow label="Items subtotal" value={subtotal.toFixed(2)} />
                        <SummaryRow label="Discount" value={toNumeric(values.discount).toFixed(2)} />
                        <SummaryRow label="Tax" value={toNumeric(values.tax).toFixed(2)} />
                        <SummaryRow label="Final total" value={grandTotal.toFixed(2)} emphasized />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div className="flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep("review")}>
                    Back to review
                  </Button>
                  <SubmitButton pendingLabel="Creating quotation..." disabled={!canReview}>
                    Save quotation
                  </SubmitButton>
                </div>
              </>
            )}
          </form>
        ) : null}
    </div>
  );
}

function QuickCustomerCreateForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (customer: CustomerOption) => void;
}) {
  const [state, formAction] = useActionState<
    QuotationQuickCustomerActionState,
    FormData
  >(quickCreateCustomerForQuotationAction, INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE);
  const { values, setValues, updateFormValue } = useFormValues<CustomerFormValues>({
    customerType: "individual",
    firstName: "",
    lastName: "",
    companyName: "",
    contactNumber: "",
    email: "",
    address: "",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    if (state.status === "success" && state.data) {
      onCreated(state.data);
      setValues({
        customerType: "individual",
        firstName: "",
        lastName: "",
        companyName: "",
        contactNumber: "",
        email: "",
        address: "",
        notes: "",
        status: "active",
      });
    }
  }, [onCreated, setValues, state]);

  return (
    <SectionCard
      title="Quick add customer"
      description="Create the customer here, then continue directly to vehicle selection."
      className="border-dashed"
    >
      <form action={formAction} className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to choices
          </Button>
        </div>

        <input type="hidden" name="address" value={values.address} />
        <input type="hidden" name="notes" value={values.notes} />

        <FormStatusMessage message={state.message} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quickCustomerType">Customer type</Label>
            <NativeSelect
              id="quickCustomerType"
              name="customerType"
              value={values.customerType}
              onChange={(event) =>
                updateFormValue("customerType", event.target.value as CustomerFormValues["customerType"])
              }
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="fleet">Fleet</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickCustomerContact">Contact number</Label>
            <Input
              id="quickCustomerContact"
              name="contactNumber"
              value={values.contactNumber}
              onChange={(event) => updateFormValue("contactNumber", event.target.value)}
              placeholder="09xx xxx xxxx"
            />
            <FieldError errors={state.fieldErrors} name="contactNumber" />
          </div>
        </div>

        {values.customerType === "individual" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quickCustomerFirstName">First name</Label>
              <Input
                id="quickCustomerFirstName"
                name="firstName"
                value={values.firstName}
                onChange={(event) => updateFormValue("firstName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="firstName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickCustomerLastName">Last name</Label>
              <Input
                id="quickCustomerLastName"
                name="lastName"
                value={values.lastName}
                onChange={(event) => updateFormValue("lastName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="lastName" />
            </div>
            <input type="hidden" name="companyName" value="" />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="quickCustomerCompanyName">
              {values.customerType === "fleet" ? "Fleet name" : "Company name"}
            </Label>
            <Input
              id="quickCustomerCompanyName"
              name="companyName"
              value={values.companyName}
              onChange={(event) => updateFormValue("companyName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="companyName" />
            <input type="hidden" name="firstName" value="" />
            <input type="hidden" name="lastName" value="" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="quickCustomerEmail">Email</Label>
          <Input
            id="quickCustomerEmail"
            name="email"
            type="email"
            value={values.email}
            onChange={(event) => updateFormValue("email", event.target.value)}
            placeholder="Optional"
          />
          <FieldError errors={state.fieldErrors} name="email" />
        </div>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Adding customer...">Add customer to intake</SubmitButton>
        </div>
      </form>
    </SectionCard>
  );
}

function QuickVehicleCreateForm({
  onBack,
  customerId,
  customerLabel,
  lookupData,
  onCreated,
}: {
  onBack: () => void;
  customerId: string;
  customerLabel: string;
  lookupData: VehicleFormLookupData;
  onCreated: (vehicle: QuotationVehicleOption) => void;
}) {
  const [state, formAction] = useActionState<
    QuotationQuickVehicleActionState,
    FormData
  >(quickCreateVehicleForQuotationAction, INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE);
  const initialVehicleValues = useMemo<VehicleFormValues>(
    () => ({
      customerId,
      make: "",
      model: "",
      year: "",
      transmission: "",
      mileage: "",
      plateNumber: "",
      vin: "",
      engineSize: "",
      variant: "",
      fuelType: "",
      color: "",
      status: "active",
    }),
    [customerId],
  );
  const { values, setValues, updateFormValue } = useFormValues(initialVehicleValues);
  const normalizedMake = values.make.trim().toLowerCase();
  const filteredModels = normalizedMake
    ? lookupData.models.filter((item) => item.makeName.trim().toLowerCase() === normalizedMake)
    : [];

  useEffect(() => {
    if (state.status === "success" && state.data) {
      onCreated(state.data);
      setValues({
        ...initialVehicleValues,
        customerId,
      });
    }
  }, [customerId, initialVehicleValues, onCreated, setValues, state]);

  return (
    <SectionCard
      title="Quick add vehicle"
      description={`Adding a vehicle directly under ${customerLabel} so the quotation can continue without leaving intake.`}
      className="border-dashed"
    >
      <form action={formAction} className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to choices
          </Button>
        </div>

        <input type="hidden" name="customerId" value={customerId} />

        <FormStatusMessage message={state.message} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quickVehicleMake">Make</Label>
            <TextAutocomplete
              id="quickVehicleMake"
              name="make"
              value={values.make}
              onValueChange={(value) => updateFormValue("make", value)}
              placeholder="Toyota"
              options={lookupData.makes.map((option) => ({
                value: option.name,
              }))}
            />
            <FieldError errors={state.fieldErrors} name="make" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehicleModel">Model</Label>
            <TextAutocomplete
              id="quickVehicleModel"
              name="model"
              value={values.model}
              onValueChange={(value) => updateFormValue("model", value)}
              placeholder="Vios"
              helperText="If the model is missing from the lookup, keep typing a custom value."
              emptyMessage={
                normalizedMake
                  ? "No matching models for this make yet. You can still type a custom value."
                  : "Type or select the make first, then choose a model suggestion."
              }
              options={filteredModels.map((option) => ({
                value: option.name,
                meta: option.makeName,
              }))}
            />
            <FieldError errors={state.fieldErrors} name="model" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quickVehicleYear">Year</Label>
            <NativeSelect
              id="quickVehicleYear"
              name="year"
              value={values.year}
              onChange={(event) => updateFormValue("year", event.target.value)}
            >
              <option value="">Select year</option>
              {getVehicleYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.fieldErrors} name="year" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehiclePlate">Plate number</Label>
            <Input
              id="quickVehiclePlate"
              name="plateNumber"
              value={values.plateNumber}
              onChange={(event) => updateFormValue("plateNumber", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="plateNumber" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehicleMileage">Mileage</Label>
            <Input
              id="quickVehicleMileage"
              name="mileage"
              inputMode="decimal"
              value={values.mileage}
              onChange={(event) => updateFormValue("mileage", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="mileage" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quickVehicleTransmission">Transmission</Label>
            <TextAutocomplete
              id="quickVehicleTransmission"
              name="transmission"
              value={values.transmission}
              onValueChange={(value) => updateFormValue("transmission", value)}
              options={lookupData.transmissions.map((option) => ({ value: option }))}
            />
            <FieldError errors={state.fieldErrors} name="transmission" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehicleFuelType">Fuel type</Label>
            <TextAutocomplete
              id="quickVehicleFuelType"
              name="fuelType"
              value={values.fuelType}
              onValueChange={(value) => updateFormValue("fuelType", value)}
              options={lookupData.fuelTypes.map((option) => ({ value: option }))}
            />
            <FieldError errors={state.fieldErrors} name="fuelType" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quickVehicleColor">Color</Label>
            <TextAutocomplete
              id="quickVehicleColor"
              name="color"
              value={values.color}
              onValueChange={(value) => updateFormValue("color", value)}
              options={lookupData.colors.map((option) => ({ value: option }))}
            />
            <FieldError errors={state.fieldErrors} name="color" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehicleEngineSize">Engine size</Label>
            <Input
              id="quickVehicleEngineSize"
              name="engineSize"
              value={values.engineSize}
              onChange={(event) => updateFormValue("engineSize", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="engineSize" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickVehicleVariant">Variant</Label>
            <Input
              id="quickVehicleVariant"
              name="variant"
              value={values.variant}
              onChange={(event) => updateFormValue("variant", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="variant" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quickVehicleVin">VIN</Label>
          <Input
            id="quickVehicleVin"
            name="vin"
            value={values.vin}
            onChange={(event) => updateFormValue("vin", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="vin" />
        </div>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Adding vehicle...">Add vehicle to intake</SubmitButton>
        </div>
      </form>
    </SectionCard>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", emphasized ? "text-base font-semibold" : "")}>
        {value}
      </span>
    </div>
  );
}

const STEP_LABELS: Record<QuotationCreateStep, string> = {
  customer: "Customer",
  vehicle: "Vehicle",
  items: "Items",
  review: "Review",
  summary: "Summary",
};

function deriveCreateStep(values: QuotationFormValues): QuotationCreateStep {
  if (!values.customerId) {
    return "customer";
  }

  if (!values.vehicleId) {
    return "vehicle";
  }

  return "items";
}

function getStepStatus(
  step: QuotationCreateStep,
  currentStep: QuotationCreateStep,
  values: QuotationFormValues,
): StepProgressStatus {
  const stepIndex = STEP_ORDER.indexOf(step);
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  if (stepIndex === currentIndex) {
    return "current";
  }

  if (stepIndex < currentIndex) {
    return "complete";
  }

  return "pending";
}

function isQuotationDraftReady(values: QuotationFormValues) {
  if (!values.customerId || !values.vehicleId || values.items.length === 0) {
    return false;
  }

  return values.items.every((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return false;
    }

    if (!item.description.trim()) {
      return false;
    }

    if (item.itemType === "product" && !item.productId) {
      return false;
    }

    if (item.itemType === "service" && !item.serviceId) {
      return false;
    }

    return true;
  });
}

function updateQuotationItem(
  setValues: React.Dispatch<React.SetStateAction<QuotationFormValues>>,
  key: string,
  patch: Partial<QuotationFormItem>,
) {
  setValues((current) => ({
    ...current,
    items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
  }));
}

function sortCustomers(customers: CustomerOption[]) {
  return [...customers].sort((left, right) => left.label.localeCompare(right.label));
}

function sortVehicles(vehicles: QuotationVehicleOption[]) {
  return [...vehicles].sort((left, right) => left.label.localeCompare(right.label));
}

function getVehicleYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 50 }, (_, index) => String(currentYear - index));
}

function IntakeChoiceGrid({
  existingLabel,
  existingDescription,
  newLabel,
  newDescription,
  existingDisabled = false,
  onChooseExisting,
  onChooseNew,
}: {
  existingLabel: string;
  existingDescription: string;
  newLabel: string;
  newDescription: string;
  existingDisabled?: boolean;
  onChooseExisting: () => void;
  onChooseNew: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        disabled={existingDisabled}
        className={cn(
          "rounded-2xl border px-5 py-5 text-left transition-colors",
          existingDisabled
            ? "cursor-not-allowed border-border/60 bg-muted/20 text-muted-foreground"
            : "border-border bg-background hover:bg-muted/35",
        )}
        onClick={onChooseExisting}
      >
        <p className="text-base font-semibold text-foreground">{existingLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {existingDisabled ? "Not available yet for this step." : existingDescription}
        </p>
      </button>
      <button
        type="button"
        className="rounded-2xl border border-border bg-background px-5 py-5 text-left transition-colors hover:bg-muted/35"
        onClick={onChooseNew}
      >
        <p className="text-base font-semibold text-foreground">{newLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">{newDescription}</p>
      </button>
    </div>
  );
}
