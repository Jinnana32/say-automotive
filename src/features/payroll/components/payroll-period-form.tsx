"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPayrollPeriodAction } from "@/features/payroll/actions/payroll-actions";
import type { PayrollPeriodFormValues } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";
import { useFormValues } from "@/lib/use-form-values";

export function PayrollPeriodForm({
  initialValues,
  closeDialog,
}: {
  initialValues: PayrollPeriodFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createPayrollPeriodAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    closeDialog();
    router.refresh();
  }, [closeDialog, router, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="space-y-2">
        <Label htmlFor="payrollLabel">Label</Label>
        <Input
          id="payrollLabel"
          name="label"
          value={values.label}
          onChange={(event) => updateFormValue("label", event.target.value)}
        />
        <FieldError errors={state.fieldErrors} name="label" />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="payrollPeriodStartDate">Start date</Label>
          <Input
            id="payrollPeriodStartDate"
            name="periodStartDate"
            type="date"
            value={values.periodStartDate}
            onChange={(event) => updateFormValue("periodStartDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="periodStartDate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payrollPeriodEndDate">End date</Label>
          <Input
            id="payrollPeriodEndDate"
            name="periodEndDate"
            type="date"
            value={values.periodEndDate}
            onChange={(event) => updateFormValue("periodEndDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="periodEndDate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payrollPayoutDate">Payout date</Label>
          <Input
            id="payrollPayoutDate"
            name="payoutDate"
            type="date"
            value={values.payoutDate}
            onChange={(event) => updateFormValue("payoutDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="payoutDate" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payrollNotes">Notes</Label>
        <Textarea
          id="payrollNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional reminder, payout batching note, or owner instruction."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Creating...">Create payroll period</SubmitButton>
      </div>
    </form>
  );
}
