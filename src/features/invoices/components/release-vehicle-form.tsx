"use client";

import { useActionState } from "react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { releaseJobOrderVehicleAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function ReleaseVehicleForm({
  jobOrderId,
  balance,
  allowReleaseWithBalance,
  requireFullPaymentBeforeRelease,
}: {
  jobOrderId: string;
  balance: number;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
}) {
  const [state, formAction] = useActionState(
    releaseJobOrderVehicleAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const blockedByPolicy =
    balance > 0 && (requireFullPaymentBeforeRelease || !allowReleaseWithBalance);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />

      <FormStatusMessage message={state.message} />

      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {blockedByPolicy
          ? "This branch requires the invoice balance to be cleared before vehicle release."
          : "Vehicle release is allowed under the current branch settings."}
      </div>

      <SubmitButton disabled={blockedByPolicy}>Release vehicle</SubmitButton>
    </form>
  );
}
