"use client";

import { useActionState } from "react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { createInvoiceFromJobOrderAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function CreateInvoiceForm({ jobOrderId }: { jobOrderId: string }) {
  const [state, formAction] = useActionState(
    createInvoiceFromJobOrderAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <FormStatusMessage message={state.message} />
      <SubmitButton>Create invoice</SubmitButton>
    </form>
  );
}
