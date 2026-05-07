"use client";

import { useActionState, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { formatJobOrderStatus } from "@/features/job-orders/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderStatusForm({
  jobOrderId,
  currentStatus,
  availableNextStatuses,
}: {
  jobOrderId: string;
  currentStatus: JobOrderStatus;
  availableNextStatuses: JobOrderStatus[];
}) {
  const [state, formAction] = useActionState(updateJobOrderStatusAction, INITIAL_FORM_ACTION_STATE);
  const [nextStatus, setNextStatus] = useState<JobOrderStatus | "">(availableNextStatuses[0] ?? "");

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Status transition</CardTitle>
        <CardDescription>
          Move the job order through the operational workflow with explicit guarded transitions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableNextStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No operational transitions are available from <span className="font-medium">{formatJobOrderStatus(currentStatus)}</span>.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="jobOrderId" value={jobOrderId} />

            <FormStatusMessage message={state.message} />

            <div className="space-y-2">
              <Label htmlFor="nextStatus">Next status</Label>
              <select
                id="nextStatus"
                name="nextStatus"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as JobOrderStatus)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {availableNextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatJobOrderStatus(status)}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="nextStatus" />
            </div>

            <div className="flex justify-end">
              <SubmitButton>Update status</SubmitButton>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
