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
import { MONEY_INPUT_STEP } from "@/lib/currency";

export function ServiceForm({
  mode,
  initialValues,
  options,
}: {
  mode: "create" | "edit";
  initialValues: ServiceFormValues;
  options: {
    branches: Array<{ id: string; label: string }>;
    permissions: {
      canMarkGlobal: boolean;
      canSelectOwningBranch: boolean;
    };
  };
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
      {!options.permissions.canSelectOwningBranch ? (
        <input type="hidden" name="owningBranchId" value={values.owningBranchId} />
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

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Catalog ownership</h3>
              <p className="text-sm text-muted-foreground">
                Services belong to a branch by default. Shared services can be reused by other
                branches only when their branch settings allow the global service catalog.
              </p>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owningBranchId">Owning branch</Label>
                <select
                  id="owningBranchId"
                  name="owningBranchId"
                  value={values.owningBranchId}
                  disabled={!options.permissions.canSelectOwningBranch}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                  onChange={(event) => updateFormValue("owningBranchId", event.target.value)}
                >
                  {options.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={state.fieldErrors} name="owningBranchId" />
              </div>

              <div className="space-y-2">
                <Label>Catalog visibility</Label>
                {options.permissions.canMarkGlobal ? (
                  <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <input
                      type="checkbox"
                      name="shareGlobally"
                      checked={values.shareGlobally}
                      onChange={(event) => updateFormValue("shareGlobally", event.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">Share globally</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, other branches can see this service if their global service
                        catalog setting is enabled.
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                    This service will stay branch-owned. Only owner and admin roles can share
                    services globally.
                    <input type="hidden" name="shareGlobally" value="" />
                  </div>
                )}
                <FieldError errors={state.fieldErrors} name="shareGlobally" />
              </div>
            </div>
          </div>

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
                type="number"
                step={MONEY_INPUT_STEP}
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
