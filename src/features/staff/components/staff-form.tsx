"use client";

import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStaffAction, updateStaffAction } from "@/features/staff/actions/staff-actions";
import { StaffPortalLoginSuccess } from "@/features/staff/components/staff-portal-login-success";
import {
  getDefaultPayrollEligibilityForRole,
  type StaffCreateActionState,
  type StaffFormValues,
} from "@/features/staff/types";
import { INITIAL_FORM_ACTION_STATE, type FormActionState } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

const INITIAL_STAFF_CREATE_ACTION_STATE: StaffCreateActionState = {
  status: "idle",
};

export function StaffForm({
  mode,
  initialValues,
  linkedPortalLoginEmail = null,
}: {
  mode: "create" | "edit";
  initialValues: StaffFormValues;
  linkedPortalLoginEmail?: string | null;
}) {
  if (mode === "create") {
    return <StaffCreateForm initialValues={initialValues} />;
  }

  return (
    <StaffEditForm
      initialValues={initialValues}
      linkedPortalLoginEmail={linkedPortalLoginEmail}
    />
  );
}

function StaffCreateForm({ initialValues }: { initialValues: StaffFormValues }) {
  const [state, formAction] = useActionState(createStaffAction, INITIAL_STAFF_CREATE_ACTION_STATE);

  if (state.status === "success" && state.portalLogin && state.staffId) {
    return (
      <StaffPortalLoginSuccess
        staffId={state.staffId}
        email={state.portalLogin.email}
        temporaryPassword={state.portalLogin.temporaryPassword}
      />
    );
  }

  return (
    <StaffFormShell
      mode="create"
      initialValues={initialValues}
      formAction={formAction}
      state={state}
    />
  );
}

function StaffEditForm({
  initialValues,
  linkedPortalLoginEmail = null,
}: {
  initialValues: StaffFormValues;
  linkedPortalLoginEmail?: string | null;
}) {
  const [state, formAction] = useActionState(updateStaffAction, INITIAL_FORM_ACTION_STATE);

  return (
    <StaffFormShell
      mode="edit"
      initialValues={initialValues}
      linkedPortalLoginEmail={linkedPortalLoginEmail}
      formAction={formAction}
      state={state}
    />
  );
}

function StaffFormShell({
  mode,
  initialValues,
  linkedPortalLoginEmail = null,
  formAction,
  state,
}: {
  mode: "create" | "edit";
  initialValues: StaffFormValues;
  linkedPortalLoginEmail?: string | null;
  formAction: (formData: FormData) => void;
  state: FormActionState | StaffCreateActionState;
}) {
  const router = useRouter();
  const { values, updateFormValue } = useFormValues(initialValues);
  const [payrollEligibilityTouched, setPayrollEligibilityTouched] = useState(false);
  const showMechanicPortalSection = values.role === "mechanic";
  const hasLinkedPortalLogin = Boolean(linkedPortalLoginEmail?.trim());

  function handleRoleChange(nextRole: StaffFormValues["role"]) {
    updateFormValue("role", nextRole);

    if (!payrollEligibilityTouched) {
      updateFormValue("isPayrollEligible", getDefaultPayrollEligibilityForRole(nextRole));
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.staffId ? <input type="hidden" name="staffId" value={initialValues.staffId} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Staff record" : "Edit staff"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Creating a mechanic also provisions an attendance portal login automatically."
              : "Staff records support mechanic assignment, attendance, and later productivity reporting."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" required>First name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={values.firstName}
                className={fieldControlClassName(state.fieldErrors, "firstName")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "firstName", required: true, errorId: fieldErrorId("firstName") })}
                onChange={(event) => updateFormValue("firstName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="firstName" id={fieldErrorId("firstName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" required>Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={values.lastName}
                className={fieldControlClassName(state.fieldErrors, "lastName")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "lastName", required: true, errorId: fieldErrorId("lastName") })}
                onChange={(event) => updateFormValue("lastName", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="lastName" id={fieldErrorId("lastName")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staffCode" optional>Staff ID</Label>
              <Input
                id="staffCode"
                name="staffCode"
                value={values.staffCode}
                readOnly
                placeholder={mode === "create" ? "Generated after creation" : ""}
                className="bg-muted/40 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used for the staff roster and physical ID cards.
              </p>
              <FieldError errors={state.fieldErrors} name="staffCode" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" required>Role</Label>
              <select
                id="role"
                name="role"
                value={values.role}
                className={formSelectClassName(state.fieldErrors, "role")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "role", required: true, errorId: fieldErrorId("role") })}
                onChange={(event) => handleRoleChange(event.target.value as StaffFormValues["role"])}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="mechanic">Mechanic</option>
                <option value="cashier">Cashier</option>
                <option value="inventory_staff">Inventory staff</option>
                <option value="service_advisor">Service advisor</option>
              </select>
              <FieldError errors={state.fieldErrors} name="role" id={fieldErrorId("role")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="documentTitle" optional>Document title / Print title</Label>
              <Input
                id="documentTitle"
                name="documentTitle"
                value={values.documentTitle}
                className={fieldControlClassName(state.fieldErrors, "documentTitle")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "documentTitle",
                  required: false,
                  errorId: fieldErrorId("documentTitle"),
                })}
                onChange={(event) => updateFormValue("documentTitle", event.target.value)}
                placeholder="Shown on print/PDF documents"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Customer-facing documents use this instead of the internal staff role.
              </p>
              <FieldError errors={state.fieldErrors} name="documentTitle" id={fieldErrorId("documentTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" required>Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className={formSelectClassName(state.fieldErrors, "status")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "status", required: true, errorId: fieldErrorId("status") })}
                onChange={(event) => updateFormValue("status", event.target.value as StaffFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
            </div>
          </div>

          {showMechanicPortalSection ? (
            <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Attendance portal login</p>
                <p className="text-sm text-muted-foreground">
                  Mechanics use this username to sign in to the attendance portal.
                </p>
              </div>

              {mode === "create" ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  A portal username and temporary password will be generated automatically after
                  you create this mechanic. Example username:{" "}
                  <span className="font-mono text-foreground">lastname@sayautocare.com</span>
                </p>
              ) : hasLinkedPortalLogin ? (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="portalLoginEmail" optional>Portal username</Label>
                  <Input
                    id="portalLoginEmail"
                    name="portalLoginEmail"
                    value={linkedPortalLoginEmail ?? ""}
                    readOnly
                    className="bg-muted/40 font-mono text-sm text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    This staff record is already linked to an attendance portal account.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="portalLoginEmail" optional>Link existing portal username</Label>
                  <Input
                    id="portalLoginEmail"
                    name="portalLoginEmail"
                    value={values.portalLoginEmail}
                    placeholder="lastname@sayautocare.com"
                    className={fieldControlClassName(state.fieldErrors, "portalLoginEmail")}
                    {...fieldAriaProps({
                      errors: state.fieldErrors,
                      name: "portalLoginEmail",
                      required: false,
                      errorId: fieldErrorId("portalLoginEmail"),
                    })}
                    onChange={(event) => updateFormValue("portalLoginEmail", event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Use this only when the mechanic already has a portal login and you
                    need to attach it to this staff record.
                  </p>
                  <FieldError
                    errors={state.fieldErrors}
                    name="portalLoginEmail"
                    id={fieldErrorId("portalLoginEmail")}
                  />
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Include in payroll</p>
                <p className="text-sm text-muted-foreground">
                  Payroll pages and cut summaries only include staff marked as payroll-eligible. Owner and admin default to excluded, but you can still opt them in here.
                </p>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPayrollEligible"
                  checked={values.isPayrollEligible}
                  onChange={(event) => {
                    setPayrollEligibilityTouched(true);
                    updateFormValue("isPayrollEligible", event.target.checked);
                  }}
                  className="mt-0.5 size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                />
                <span className="text-sm font-medium text-foreground">
                  {values.isPayrollEligible ? "Included" : "Excluded"}
                </span>
              </label>
            </div>
            <FieldError errors={state.fieldErrors} name="isPayrollEligible" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="emergencyContactNumber" optional>Emergency contact number</Label>
              <Input
                id="emergencyContactNumber"
                name="emergencyContactNumber"
                value={values.emergencyContactNumber}
                className={fieldControlClassName(state.fieldErrors, "emergencyContactNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "emergencyContactNumber",
                  required: false,
                  errorId: fieldErrorId("emergencyContactNumber"),
                })}
                onChange={(event) => updateFormValue("emergencyContactNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="emergencyContactNumber" id={fieldErrorId("emergencyContactNumber")} />
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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sssNumber" optional>SSS number</Label>
              <Input
                id="sssNumber"
                name="sssNumber"
                value={values.sssNumber}
                className={fieldControlClassName(state.fieldErrors, "sssNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "sssNumber",
                  required: false,
                  errorId: fieldErrorId("sssNumber"),
                })}
                onChange={(event) => updateFormValue("sssNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="sssNumber" id={fieldErrorId("sssNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealthNumber" optional>PhilHealth number</Label>
              <Input
                id="philhealthNumber"
                name="philhealthNumber"
                value={values.philhealthNumber}
                className={fieldControlClassName(state.fieldErrors, "philhealthNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "philhealthNumber",
                  required: false,
                  errorId: fieldErrorId("philhealthNumber"),
                })}
                onChange={(event) => updateFormValue("philhealthNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="philhealthNumber" id={fieldErrorId("philhealthNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tinNumber" optional>TIN</Label>
              <Input
                id="tinNumber"
                name="tinNumber"
                value={values.tinNumber}
                className={fieldControlClassName(state.fieldErrors, "tinNumber")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "tinNumber",
                  required: false,
                  errorId: fieldErrorId("tinNumber"),
                })}
                onChange={(event) => updateFormValue("tinNumber", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="tinNumber" id={fieldErrorId("tinNumber")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactName" optional>Emergency contact name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              value={values.emergencyContactName}
              className={fieldControlClassName(state.fieldErrors, "emergencyContactName")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "emergencyContactName",
                required: false,
                errorId: fieldErrorId("emergencyContactName"),
              })}
              onChange={(event) => updateFormValue("emergencyContactName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="emergencyContactName" id={fieldErrorId("emergencyContactName")} />
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create staff record" : "Save changes"}
            </SubmitButton>
            <Button type="button" variant="outline" onClick={() => router.push("/staff")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
