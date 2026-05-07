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
import { createStaffAction, updateStaffAction } from "@/features/staff/actions/staff-actions";
import type { StaffFormValues } from "@/features/staff/types";

export function StaffForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: StaffFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createStaffAction : updateStaffAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.staffId ? <input type="hidden" name="staffId" value={initialValues.staffId} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Staff record" : "Edit staff"}</CardTitle>
          <CardDescription>
            Staff records support mechanic assignment, attendance, and later productivity reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormStatusMessage message={state.message} />

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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={values.role}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("role", event.target.value as StaffFormValues["role"])}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="mechanic">Mechanic</option>
                <option value="cashier">Cashier</option>
                <option value="inventory_staff">Inventory staff</option>
                <option value="service_advisor">Service advisor</option>
              </select>
              <FieldError errors={state.fieldErrors} name="role" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("status", event.target.value as StaffFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact number</Label>
              <Input id="contactNumber" name="contactNumber" value={values.contactNumber} onChange={(event) => updateFormValue("contactNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="contactNumber" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactNumber">Emergency contact number</Label>
              <Input
                id="emergencyContactNumber"
                name="emergencyContactNumber"
                value={values.emergencyContactNumber}
                onChange={(event) => updateFormValue("emergencyContactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="emergencyContactNumber" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={values.address} onChange={(event) => updateFormValue("address", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="address" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sssNumber">SSS number</Label>
              <Input id="sssNumber" name="sssNumber" value={values.sssNumber} onChange={(event) => updateFormValue("sssNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="sssNumber" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealthNumber">PhilHealth number</Label>
              <Input
                id="philhealthNumber"
                name="philhealthNumber"
                value={values.philhealthNumber}
                onChange={(event) => updateFormValue("philhealthNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="philhealthNumber" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tinNumber">TIN</Label>
              <Input id="tinNumber" name="tinNumber" value={values.tinNumber} onChange={(event) => updateFormValue("tinNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="tinNumber" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency contact name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              value={values.emergencyContactName}
              onChange={(event) => updateFormValue("emergencyContactName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="emergencyContactName" />
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create staff record" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href="/staff">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
