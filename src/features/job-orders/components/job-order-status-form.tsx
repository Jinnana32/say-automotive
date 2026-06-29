"use client";

import { useActionState, useState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab, JobOrderStatus } from "@/features/job-orders/types";
import { formatJobOrderStatus } from "@/features/job-orders/utils";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderStatusForm({
  jobOrderId,
  currentStatus,
  availableNextStatuses,
  closeDialog,
  redirectTab,
}: {
  jobOrderId: string;
  currentStatus: JobOrderStatus;
  availableNextStatuses: JobOrderStatus[];
  closeDialog: () => void;
  redirectTab: JobOrderDetailTab;
}) {
  const [state, formAction] = useActionState(updateJobOrderStatusAction, INITIAL_FORM_ACTION_STATE);
  const [nextStatus, setNextStatus] = useState<JobOrderStatus | "">(availableNextStatuses[0] ?? "");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="redirectTab" value={redirectTab} />

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Current status
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <JobOrderStatusBadge status={currentStatus} />
          <span className="text-sm text-muted-foreground">
            {formatJobOrderStatus(currentStatus)}
          </span>
        </div>
      </div>

      <FormStatusMessage message={state.message} />

      <div className="space-y-2">
        <Label htmlFor={`nextStatus-${jobOrderId}`} required>Next status</Label>
        <NativeSelect
          id={`nextStatus-${jobOrderId}`}
          name="nextStatus"
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as JobOrderStatus)}
        >
          {availableNextStatuses.map((status) => (
            <option key={status} value={status}>
              {formatJobOrderStatus(status)}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="nextStatus" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Updating...">Update status</SubmitButton>
      </div>
    </form>
  );
}
