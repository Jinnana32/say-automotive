"use client";

import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignMechanicAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab, JobOrderMechanicOption } from "@/features/job-orders/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function AssignMechanicForm({
  jobOrderId,
  mechanics,
  redirectTab,
}: {
  jobOrderId: string;
  mechanics: JobOrderMechanicOption[];
  redirectTab: JobOrderDetailTab;
}) {
  const [state, formAction] = useActionState(assignMechanicAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    staffId: mechanics[0]?.id ?? "",
    taskDescription: "",
  });

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Assign mechanic</CardTitle>
        <CardDescription>
          Multiple mechanics can work on the same job order. Assignments stay separate from the job header.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mechanics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned active mechanics are available.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="jobOrderId" value={jobOrderId} />
            <input type="hidden" name="redirectTab" value={redirectTab} />

            <FormStatusMessage message={state.message} />

            <div className="space-y-2">
              <Label htmlFor="staffId">Mechanic</Label>
              <select
                id="staffId"
                name="staffId"
                value={values.staffId}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("staffId", event.target.value)}
              >
                {mechanics.map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.label}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="staffId" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDescription">Task description</Label>
              <Textarea
                id="taskDescription"
                name="taskDescription"
                placeholder="Optional focus area for this mechanic"
                value={values.taskDescription}
                onChange={(event) => updateFormValue("taskDescription", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="taskDescription" />
            </div>

            <div className="flex justify-end">
              <SubmitButton>Assign mechanic</SubmitButton>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
