"use client";

import Link from "next/link";
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
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { createSupplierAction, updateSupplierAction } from "@/features/suppliers/actions/supplier-actions";
import type { SupplierFormValues } from "@/features/suppliers/types";

export function SupplierForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: SupplierFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createSupplierAction : updateSupplierAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.supplierId ? (
        <input type="hidden" name="supplierId" value={initialValues.supplierId} />
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Supplier record" : "Edit supplier"}</CardTitle>
          <CardDescription>
            Suppliers stay reusable across products, stock receiving, and future purchase orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="supplierName" required>Supplier name</Label>
            <Input
              id="supplierName"
              name="supplierName"
              value={values.supplierName}
              className={fieldControlClassName(state.fieldErrors, "supplierName")}
              {...fieldAriaProps({ errors: state.fieldErrors, name: "supplierName", required: true, errorId: fieldErrorId("supplierName") })}
              onChange={(event) => updateFormValue("supplierName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="supplierName" id={fieldErrorId("supplierName")} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson" optional>Contact person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={values.contactPerson}
                className={fieldControlClassName(state.fieldErrors, "contactPerson")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "contactPerson",
                  required: false,
                  errorId: fieldErrorId("contactPerson"),
                })}
                onChange={(event) => updateFormValue("contactPerson", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="contactPerson" id={fieldErrorId("contactPerson")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" optional>Contact number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={values.contactNumber}
                className={fieldControlClassName(state.fieldErrors, "contactNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "contactNumber",
                  required: false,
                  errorId: fieldErrorId("contactNumber"),
                })}
                onChange={(event) => updateFormValue("contactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="contactNumber" id={fieldErrorId("contactNumber")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" optional>Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={values.email}
                className={fieldControlClassName(state.fieldErrors, "email")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "email", required: false, errorId: fieldErrorId("email") })}
                onChange={(event) => updateFormValue("email", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="email" id={fieldErrorId("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms" optional>Payment terms</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                value={values.paymentTerms}
                className={fieldControlClassName(state.fieldErrors, "paymentTerms")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "paymentTerms",
                  required: false,
                  errorId: fieldErrorId("paymentTerms"),
                })}
                onChange={(event) => updateFormValue("paymentTerms", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="paymentTerms" id={fieldErrorId("paymentTerms")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" optional>Address</Label>
            <Textarea
              id="address"
              name="address"
              value={values.address}
              className={fieldControlClassName(state.fieldErrors, "address")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "address",
                required: false,
                errorId: fieldErrorId("address"),
              })}
              onChange={(event) => updateFormValue("address", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="address" id={fieldErrorId("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" optional>Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={values.notes}
              className={fieldControlClassName(state.fieldErrors, "notes")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "notes",
                required: false,
                errorId: fieldErrorId("notes"),
              })}
              onChange={(event) => updateFormValue("notes", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" required>Status</Label>
            <select
              id="status"
              name="status"
              value={values.status}
              className={formSelectClassName(state.fieldErrors, "status")}
              {...fieldAriaProps({ errors: state.fieldErrors, name: "status", required: true, errorId: fieldErrorId("status") })}
              onChange={(event) => updateFormValue("status", event.target.value as SupplierFormValues["status"])}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create supplier" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href="/suppliers">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
