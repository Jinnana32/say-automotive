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
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/features/customers/actions/customer-actions";
import type { CustomerFormValues } from "@/features/customers/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function CustomerForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: CustomerFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createCustomerAction : updateCustomerAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.customerId ? (
        <input type="hidden" name="customerId" value={initialValues.customerId} />
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Customer profile" : "Edit customer"}</CardTitle>
          <CardDescription>
            Keep customer records clean because every vehicle, quotation, and invoice depends on
            this data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerType">Customer type</Label>
              <select
                id="customerType"
                name="customerType"
                value={values.customerType}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  updateFormValue("customerType", event.target.value as CustomerFormValues["customerType"])
                }
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="fleet">Fleet</option>
              </select>
              <FieldError errors={state.fieldErrors} name="customerType" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("status", event.target.value as CustomerFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" value={values.firstName} onChange={(event) => updateFormValue("firstName", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="firstName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" value={values.lastName} onChange={(event) => updateFormValue("lastName", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="lastName" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company or fleet name</Label>
            <Input id="companyName" name="companyName" value={values.companyName} onChange={(event) => updateFormValue("companyName", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="companyName" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={values.contactNumber}
                onChange={(event) => updateFormValue("contactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="contactNumber" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={values.email} onChange={(event) => updateFormValue("email", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="email" />
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

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create customer" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href={mode === "create" ? "/customers" : `/customers/${initialValues.customerId}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
