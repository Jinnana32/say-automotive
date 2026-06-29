"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
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
      <FormRequiredFieldsNote />
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="space-y-2">
        <Label htmlFor="payrollLabel" required>
          Label
        </Label>
        <Input
          id="payrollLabel"
          name="label"
          value={values.label}
          onChange={(event) => updateFormValue("label", event.target.value)}
          className={fieldControlClassName(state.fieldErrors, "label")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "label",
            required: true,
            errorId: fieldErrorId("label"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="label" id={fieldErrorId("label")} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="payrollPeriodStartDate" required>
            Start date
          </Label>
          <Input
            id="payrollPeriodStartDate"
            name="periodStartDate"
            type="date"
            value={values.periodStartDate}
            onChange={(event) => updateFormValue("periodStartDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "periodStartDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "periodStartDate",
              required: true,
              errorId: fieldErrorId("periodStartDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="periodStartDate" id={fieldErrorId("periodStartDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payrollPeriodEndDate" required>
            End date
          </Label>
          <Input
            id="payrollPeriodEndDate"
            name="periodEndDate"
            type="date"
            value={values.periodEndDate}
            onChange={(event) => updateFormValue("periodEndDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "periodEndDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "periodEndDate",
              required: true,
              errorId: fieldErrorId("periodEndDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="periodEndDate" id={fieldErrorId("periodEndDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payrollPayoutDate" required>
            Payout date
          </Label>
          <Input
            id="payrollPayoutDate"
            name="payoutDate"
            type="date"
            value={values.payoutDate}
            onChange={(event) => updateFormValue("payoutDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "payoutDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "payoutDate",
              required: true,
              errorId: fieldErrorId("payoutDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="payoutDate" id={fieldErrorId("payoutDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payrollNotes" optional>Notes</Label>
        <Textarea
          id="payrollNotes"
          name="notes"
          value={values.notes}
          className={fieldControlClassName(state.fieldErrors, "notes")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "notes",
            required: false,
            errorId: fieldErrorId("notes"),
          })}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional reminder, payout batching note, or owner instruction."
        />
        <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
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
