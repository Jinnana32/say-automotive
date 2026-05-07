"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { updatePayrollPeriodStatusAction } from "@/features/payroll/actions/payroll-actions";
import type { PayrollPeriodStatus } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";

export function PayrollPeriodStatusForm({
  periodId,
  currentStatus,
  canFinalize,
}: {
  periodId: string;
  currentStatus: PayrollPeriodStatus;
  canFinalize: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updatePayrollPeriodStatusAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="periodId" value={periodId} />

      <div className="flex flex-wrap gap-2">
        {currentStatus === "draft" ? (
          <SubmitButton
            name="status"
            value="processing"
            variant="outline"
            pendingLabel="Updating..."
          >
            Mark processing
          </SubmitButton>
        ) : null}

        {currentStatus === "processing" ? (
          <Button type="submit" name="status" value="draft" variant="outline">
            Return to draft
          </Button>
        ) : null}

        {currentStatus !== "finalized" ? (
          <SubmitButton
            name="status"
            value="finalized"
            disabled={!canFinalize}
            pendingLabel="Finalizing..."
          >
            Finalize period
          </SubmitButton>
        ) : null}
      </div>

      {!canFinalize && currentStatus !== "finalized" ? (
        <p className="text-xs text-muted-foreground">
          Finalization unlocks only when no staff with attendance activity are missing compensation or a time out.
        </p>
      ) : null}

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
    </form>
  );
}
