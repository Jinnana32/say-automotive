"use client";

import { useActionState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveJobOrderDetailsAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetail, JobOrderDetailTab } from "@/features/job-orders/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function JobOrderDetailsForm({
  detail,
  redirectTab,
}: {
  detail: JobOrderDetail;
  redirectTab: JobOrderDetailTab;
}) {
  const [state, formAction] = useActionState(saveJobOrderDetailsAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    mileageIn: detail.mileageIn ?? "",
    mileageOut: detail.mileageOut ?? "",
    customerConcern: detail.customerConcern ?? "",
    inspectionNotes: detail.inspectionNotes ?? "",
    diagnosis: detail.diagnosis ?? "",
    workPerformed: detail.workPerformed ?? "",
  });

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Operational notes</CardTitle>
        <CardDescription>
          Keep the job order as the source of truth for actual diagnosis and work performed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="jobOrderId" value={detail.id} />
          <input type="hidden" name="redirectTab" value={redirectTab} />

          <FormStatusMessage message={state.message} />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mileageIn">Mileage in</Label>
              <Input
                id="mileageIn"
                name="mileageIn"
                value={values.mileageIn}
                onChange={(event) => updateFormValue("mileageIn", event.target.value)}
                inputMode="decimal"
                className={fieldControlClassName(state.fieldErrors, "mileageIn")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "mileageIn",
                  errorId: fieldErrorId("mileageIn"),
                })}
              />
              <FieldError errors={state.fieldErrors} name="mileageIn" id={fieldErrorId("mileageIn")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileageOut">Mileage out</Label>
              <Input
                id="mileageOut"
                name="mileageOut"
                value={values.mileageOut}
                onChange={(event) => updateFormValue("mileageOut", event.target.value)}
                inputMode="decimal"
                className={fieldControlClassName(state.fieldErrors, "mileageOut")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "mileageOut",
                  errorId: fieldErrorId("mileageOut"),
                })}
              />
              <FieldError errors={state.fieldErrors} name="mileageOut" id={fieldErrorId("mileageOut")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerConcern">Customer concern</Label>
            <Textarea
              id="customerConcern"
              name="customerConcern"
              value={values.customerConcern}
              onChange={(event) => updateFormValue("customerConcern", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "customerConcern")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "customerConcern",
                errorId: fieldErrorId("customerConcern"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="customerConcern" id={fieldErrorId("customerConcern")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionNotes">Inspection notes</Label>
            <Textarea
              id="inspectionNotes"
              name="inspectionNotes"
              value={values.inspectionNotes}
              onChange={(event) => updateFormValue("inspectionNotes", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "inspectionNotes")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "inspectionNotes",
                errorId: fieldErrorId("inspectionNotes"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="inspectionNotes" id={fieldErrorId("inspectionNotes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              name="diagnosis"
              value={values.diagnosis}
              onChange={(event) => updateFormValue("diagnosis", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "diagnosis")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "diagnosis",
                errorId: fieldErrorId("diagnosis"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="diagnosis" id={fieldErrorId("diagnosis")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workPerformed">Work performed</Label>
            <Textarea
              id="workPerformed"
              name="workPerformed"
              value={values.workPerformed}
              onChange={(event) => updateFormValue("workPerformed", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "workPerformed")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "workPerformed",
                errorId: fieldErrorId("workPerformed"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="workPerformed" id={fieldErrorId("workPerformed")} />
          </div>

          <div className="flex justify-end">
            <SubmitButton>Save operational notes</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
