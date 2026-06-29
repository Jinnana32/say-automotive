"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { TextAutocomplete } from "@/components/shared/text-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/features/vehicles/actions/vehicle-actions";
import type { VehicleFormLookupData, VehicleFormValues } from "@/features/vehicles/types";
import type { CustomerOption } from "@/features/customers/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function VehicleForm({
  mode,
  initialValues,
  customerOptions,
  lookupData,
}: {
  mode: "create" | "edit";
  initialValues: VehicleFormValues;
  customerOptions: CustomerOption[];
  lookupData: VehicleFormLookupData;
}) {
  const [actionState, formAction] = useActionState(
    mode === "create" ? createVehicleAction : updateVehicleAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [values, setValues] = useState(initialValues);

  const normalizedMake = values.make.trim().toLowerCase();
  const filteredModels = normalizedMake
    ? lookupData.models.filter((item) => item.makeName.trim().toLowerCase() === normalizedMake)
    : [];
  const yearOptions = getVehicleYearOptions();

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.vehicleId ? (
        <input type="hidden" name="vehicleId" value={initialValues.vehicleId} />
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Vehicle profile" : "Edit vehicle"}</CardTitle>
          <CardDescription>
            Vehicle records link customers to quotations, job orders, and service history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={actionState.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId" required>
                Customer
              </Label>
              <select
                id="customerId"
                name="customerId"
                value={values.customerId}
                className={formSelectClassName(actionState.fieldErrors, "customerId")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "customerId",
                  required: true,
                  errorId: fieldErrorId("customerId"),
                })}
                onChange={(event) => updateFormValue("customerId", event.target.value)}
              >
                <option value="">Select customer</option>
                {customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError errors={actionState.fieldErrors} name="customerId" id={fieldErrorId("customerId")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" required>
                Status
              </Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className={formSelectClassName(actionState.fieldErrors, "status")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "status",
                  required: true,
                  errorId: fieldErrorId("status"),
                })}
                onChange={(event) => updateFormValue("status", event.target.value as VehicleFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={actionState.fieldErrors} name="status" id={fieldErrorId("status")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="make" required>
                Make
              </Label>
              <TextAutocomplete
                id="make"
                name="make"
                value={values.make}
                onValueChange={(value) => updateFormValue("make", value)}
                placeholder="Toyota"
                inputClassName={fieldControlClassName(actionState.fieldErrors, "make")}
                inputProps={fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "make",
                  required: true,
                  errorId: fieldErrorId("make"),
                })}
                options={lookupData.makes.map((option) => ({
                  value: option.name,
                }))}
              />
              <FieldError errors={actionState.fieldErrors} name="make" id={fieldErrorId("make")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" required>
                Model
              </Label>
              <TextAutocomplete
                id="model"
                name="model"
                value={values.model}
                onValueChange={(value) => updateFormValue("model", value)}
                placeholder="Vios"
                helperText="Suggested from internal lookup data. You can still type a custom value if missing."
                emptyMessage={
                  normalizedMake
                    ? "No matching models for this make yet. You can keep typing a custom value."
                    : "Select or type a make first, then pick a suggested model or enter a custom value."
                }
                inputClassName={fieldControlClassName(actionState.fieldErrors, "model")}
                inputProps={fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "model",
                  required: true,
                  errorId: fieldErrorId("model"),
                })}
                options={filteredModels.map((option) => ({
                  value: option.name,
                  meta: option.makeName,
                }))}
              />
              <FieldError errors={actionState.fieldErrors} name="model" id={fieldErrorId("model")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="year" optional>
                Year
              </Label>
              <NativeSelect
                id="year"
                name="year"
                value={values.year}
                className={fieldControlClassName(actionState.fieldErrors, "year")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "year",
                  required: false,
                  errorId: fieldErrorId("year"),
                })}
                onChange={(event) => updateFormValue("year", event.target.value)}
              >
                <option value="">Select year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={actionState.fieldErrors} name="year" id={fieldErrorId("year")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage" optional>
                Mileage
              </Label>
              <Input
                id="mileage"
                name="mileage"
                inputMode="decimal"
                value={values.mileage}
                className={fieldControlClassName(actionState.fieldErrors, "mileage")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "mileage",
                  required: false,
                  errorId: fieldErrorId("mileage"),
                })}
                onChange={(event) => updateFormValue("mileage", event.target.value)}
              />
              <FieldError errors={actionState.fieldErrors} name="mileage" id={fieldErrorId("mileage")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transmission" optional>
                Transmission
              </Label>
              <Input
                id="transmission"
                name="transmission"
                list="vehicle-transmission-options"
                value={values.transmission}
                className={fieldControlClassName(actionState.fieldErrors, "transmission")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "transmission",
                  required: false,
                  errorId: fieldErrorId("transmission"),
                })}
                onChange={(event) => updateFormValue("transmission", event.target.value)}
              />
              <datalist id="vehicle-transmission-options">
                {lookupData.transmissions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <FieldError errors={actionState.fieldErrors} name="transmission" id={fieldErrorId("transmission")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plateNumber" optional>
                Plate number
              </Label>
              <Input
                id="plateNumber"
                name="plateNumber"
                value={values.plateNumber}
                className={fieldControlClassName(actionState.fieldErrors, "plateNumber")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "plateNumber",
                  required: false,
                  errorId: fieldErrorId("plateNumber"),
                })}
                onChange={(event) => updateFormValue("plateNumber", event.target.value)}
              />
              <FieldError errors={actionState.fieldErrors} name="plateNumber" id={fieldErrorId("plateNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin" optional>
                VIN
              </Label>
              <Input
                id="vin"
                name="vin"
                value={values.vin}
                className={fieldControlClassName(actionState.fieldErrors, "vin")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "vin",
                  required: false,
                  errorId: fieldErrorId("vin"),
                })}
                onChange={(event) => updateFormValue("vin", event.target.value)}
              />
              <FieldError errors={actionState.fieldErrors} name="vin" id={fieldErrorId("vin")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="engineSize" optional>
                Engine size
              </Label>
              <Input
                id="engineSize"
                name="engineSize"
                value={values.engineSize}
                className={fieldControlClassName(actionState.fieldErrors, "engineSize")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "engineSize",
                  required: false,
                  errorId: fieldErrorId("engineSize"),
                })}
                onChange={(event) => updateFormValue("engineSize", event.target.value)}
              />
              <FieldError errors={actionState.fieldErrors} name="engineSize" id={fieldErrorId("engineSize")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant" optional>
                Variant
              </Label>
              <Input
                id="variant"
                name="variant"
                value={values.variant}
                className={fieldControlClassName(actionState.fieldErrors, "variant")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "variant",
                  required: false,
                  errorId: fieldErrorId("variant"),
                })}
                onChange={(event) => updateFormValue("variant", event.target.value)}
              />
              <FieldError errors={actionState.fieldErrors} name="variant" id={fieldErrorId("variant")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuelType" optional>
                Fuel type
              </Label>
              <Input
                id="fuelType"
                name="fuelType"
                list="vehicle-fuel-type-options"
                value={values.fuelType}
                className={fieldControlClassName(actionState.fieldErrors, "fuelType")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "fuelType",
                  required: false,
                  errorId: fieldErrorId("fuelType"),
                })}
                onChange={(event) => updateFormValue("fuelType", event.target.value)}
              />
              <datalist id="vehicle-fuel-type-options">
                {lookupData.fuelTypes.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <FieldError errors={actionState.fieldErrors} name="fuelType" id={fieldErrorId("fuelType")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" optional>
                Color
              </Label>
              <Input
                id="color"
                name="color"
                list="vehicle-color-options"
                value={values.color}
                className={fieldControlClassName(actionState.fieldErrors, "color")}
                {...fieldAriaProps({
                  errors: actionState.fieldErrors,
                  name: "color",
                  required: false,
                  errorId: fieldErrorId("color"),
                })}
                onChange={(event) => updateFormValue("color", event.target.value)}
              />
              <datalist id="vehicle-color-options">
                {lookupData.colors.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <FieldError errors={actionState.fieldErrors} name="color" id={fieldErrorId("color")} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create vehicle" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href={mode === "create" ? "/vehicles" : `/customers/${initialValues.customerId}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );

  function updateFormValue<Key extends keyof VehicleFormValues>(
    key: Key,
    value: VehicleFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }
}

function getVehicleYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 50 }, (_, index) => String(currentYear - index));
}
