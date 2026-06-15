"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { generatePayrollCutAction } from "@/features/payroll/actions/payroll-actions";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";

export function GeneratePayrollCutButton({
  periodId,
  hasGeneratedCut,
  disabled = false,
}: {
  periodId: string;
  hasGeneratedCut: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    generatePayrollCutAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="periodId" value={periodId} />
      <SubmitButton pendingLabel={hasGeneratedCut ? "Refreshing..." : "Generating..."} disabled={disabled}>
        {hasGeneratedCut ? "Refresh cut summary" : "Generate payroll cut"}
      </SubmitButton>
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
    </form>
  );
}
