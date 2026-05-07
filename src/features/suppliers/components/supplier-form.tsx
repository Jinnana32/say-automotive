"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
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
          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="supplierName">Supplier name</Label>
            <Input id="supplierName" name="supplierName" value={values.supplierName} onChange={(event) => updateFormValue("supplierName", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="supplierName" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" name="contactPerson" value={values.contactPerson} onChange={(event) => updateFormValue("contactPerson", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="contactPerson" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact number</Label>
              <Input id="contactNumber" name="contactNumber" value={values.contactNumber} onChange={(event) => updateFormValue("contactNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="contactNumber" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={values.email} onChange={(event) => updateFormValue("email", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment terms</Label>
              <Input id="paymentTerms" name="paymentTerms" value={values.paymentTerms} onChange={(event) => updateFormValue("paymentTerms", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="paymentTerms" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={values.address} onChange={(event) => updateFormValue("address", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" value={values.notes} onChange={(event) => updateFormValue("notes", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="notes" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={values.status}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => updateFormValue("status", event.target.value as SupplierFormValues["status"])}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FieldError errors={state.fieldErrors} name="status" />
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
