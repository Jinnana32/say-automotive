"use client";

import { useActionState } from "react";

import { FormSection } from "@/components/shared/form-section";
import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createVehicleLookupOptionAction,
  createVehicleMakeAction,
  createVehicleModelAction,
  updateVehicleLookupOptionStatusAction,
  updateVehicleMakeStatusAction,
  updateVehicleModelStatusAction,
} from "@/features/vehicles/actions/vehicle-lookup-actions";
import type {
  VehicleLookupOptionGroup,
  VehicleLookupType,
  VehicleMakeItem,
  VehicleModelItem,
} from "@/features/vehicles/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function VehicleMakeLookupSection({ makes }: { makes: VehicleMakeItem[] }) {
  const [state, formAction] = useActionState(createVehicleMakeAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    name: "",
    sortOrder: "",
  });

  return (
    <FormSection
      title="Vehicle makes"
      description="Internal make catalog used by vehicle registration and model suggestions."
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px_auto]">
        <div className="space-y-2">
          <Label htmlFor="vehicleMakeName">Make name</Label>
          <Input id="vehicleMakeName" name="name" placeholder="Toyota" value={values.name} onChange={(event) => updateFormValue("name", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleMakeSortOrder">Sort order</Label>
          <Input id="vehicleMakeSortOrder" name="sortOrder" inputMode="numeric" placeholder="0" value={values.sortOrder} onChange={(event) => updateFormValue("sortOrder", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="sortOrder" />
        </div>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Adding...">Add make</SubmitButton>
        </div>
      </form>
      <FormStatusMessage message={state.message} />

      <div className="mt-5 space-y-3">
        {makes.map((make) => (
          <div
            key={make.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{make.name}</p>
                <StatusBadge tone={make.status === "active" ? "success" : "neutral"}>
                  {make.status}
                </StatusBadge>
                {make.isSeeded ? <StatusBadge tone="info">Seeded</StatusBadge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {make.modelCount} active models
                {make.externalSource ? ` · ${make.externalSource}` : ""}
              </p>
            </div>
            <form action={updateVehicleMakeStatusAction}>
              <input type="hidden" name="makeId" value={make.id} />
              <input type="hidden" name="status" value={make.status === "active" ? "inactive" : "active"} />
              <Button type="submit" size="sm" variant="outline">
                {make.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

export function VehicleModelLookupSection({
  makes,
  models,
}: {
  makes: VehicleMakeItem[];
  models: VehicleModelItem[];
}) {
  const [state, formAction] = useActionState(createVehicleModelAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    makeId: "",
    name: "",
    sortOrder: "",
  });

  return (
    <FormSection
      title="Vehicle models"
      description="Models linked to a make. Vehicle registration uses these as suggestions only."
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_140px_auto]">
        <div className="space-y-2">
          <Label htmlFor="vehicleModelMakeId">Make</Label>
          <NativeSelect id="vehicleModelMakeId" name="makeId" value={values.makeId} onChange={(event) => updateFormValue("makeId", event.target.value)}>
            <option value="">Select make</option>
            {makes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="makeId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleModelName">Model name</Label>
          <Input id="vehicleModelName" name="name" placeholder="Vios" value={values.name} onChange={(event) => updateFormValue("name", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleModelSortOrder">Sort order</Label>
          <Input id="vehicleModelSortOrder" name="sortOrder" inputMode="numeric" placeholder="0" value={values.sortOrder} onChange={(event) => updateFormValue("sortOrder", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="sortOrder" />
        </div>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Adding...">Add model</SubmitButton>
        </div>
      </form>
      <FormStatusMessage message={state.message} />

      <div className="mt-5 space-y-3">
        {models.map((model) => (
          <div
            key={model.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {model.makeName} {model.name}
                </p>
                <StatusBadge tone={model.status === "active" ? "success" : "neutral"}>
                  {model.status}
                </StatusBadge>
                {model.isSeeded ? <StatusBadge tone="info">Seeded</StatusBadge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {model.externalSource ? `${model.externalSource} · ` : ""}Sort {model.sortOrder}
              </p>
            </div>
            <form action={updateVehicleModelStatusAction}>
              <input type="hidden" name="modelId" value={model.id} />
              <input type="hidden" name="status" value={model.status === "active" ? "inactive" : "active"} />
              <Button type="submit" size="sm" variant="outline">
                {model.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

export function VehicleLookupOptionSection({ group }: { group: VehicleLookupOptionGroup }) {
  const [state, formAction] = useActionState(
    createVehicleLookupOptionAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    label: "",
    sortOrder: "",
  });

  return (
    <FormSection title={group.label} description="Internal dropdown suggestions with manual fallback allowed.">
      <form action={formAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_auto]">
        <input type="hidden" name="lookupType" value={group.lookupType} />
        <div className="space-y-2">
          <Label htmlFor={`${group.lookupType}-label`}>Label</Label>
          <Input id={`${group.lookupType}-label`} name="label" placeholder={getPlaceholder(group.lookupType)} value={values.label} onChange={(event) => updateFormValue("label", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="label" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${group.lookupType}-sortOrder`}>Sort order</Label>
          <Input
            id={`${group.lookupType}-sortOrder`}
            name="sortOrder"
            inputMode="numeric"
            placeholder="0"
            value={values.sortOrder}
            onChange={(event) => updateFormValue("sortOrder", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="sortOrder" />
        </div>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Adding...">Add option</SubmitButton>
        </div>
      </form>
      <FormStatusMessage message={state.message} />

      <div className="mt-5 space-y-3">
        {group.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <p className="font-medium">{item.label}</p>
              <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
                {item.status}
              </StatusBadge>
            </div>
            <form action={updateVehicleLookupOptionStatusAction}>
              <input type="hidden" name="optionId" value={item.id} />
              <input type="hidden" name="status" value={item.status === "active" ? "inactive" : "active"} />
              <Button type="submit" size="sm" variant="outline">
                {item.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function getPlaceholder(lookupType: VehicleLookupType) {
  if (lookupType === "transmission") {
    return "Automatic";
  }

  if (lookupType === "fuel_type") {
    return "Diesel";
  }

  return "Gray";
}
