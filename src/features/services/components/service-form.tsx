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
import { createServiceAction, updateServiceAction } from "@/features/services/actions/service-actions";
import type { ServiceFormValues } from "@/features/services/types";

export function ServiceForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: ServiceFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createServiceAction : updateServiceAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.serviceId ? (
        <input type="hidden" name="serviceId" value={initialValues.serviceId} />
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Service record" : "Edit service"}</CardTitle>
          <CardDescription>
            Service catalog entries should be reusable across quotations, job orders, and billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Service name</Label>
              <Input id="name" name="name" value={values.name} onChange={(event) => updateFormValue("name", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={values.category} onChange={(event) => updateFormValue("category", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="category" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="laborPrice">Labor price</Label>
              <Input
                id="laborPrice"
                name="laborPrice"
                inputMode="decimal"
                value={values.laborPrice}
                onChange={(event) => updateFormValue("laborPrice", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="laborPrice" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDurationMinutes">Estimated duration (minutes)</Label>
              <Input
                id="estimatedDurationMinutes"
                name="estimatedDurationMinutes"
                inputMode="numeric"
                value={values.estimatedDurationMinutes}
                onChange={(event) => updateFormValue("estimatedDurationMinutes", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="estimatedDurationMinutes" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={values.description} onChange={(event) => updateFormValue("description", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={values.status}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => updateFormValue("status", event.target.value as ServiceFormValues["status"])}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FieldError errors={state.fieldErrors} name="status" />
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create service" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href="/services">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
