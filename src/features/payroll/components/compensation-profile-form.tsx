"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { upsertCompensationProfileAction } from "@/features/payroll/actions/payroll-actions";
import type { CompensationProfileFormValues } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE, PAY_BASIS_OPTIONS } from "@/features/payroll/utils";
import { useFormValues } from "@/lib/use-form-values";

export function CompensationProfileForm({
  staffName,
  initialValues,
  closeDialog,
}: {
  staffName: string;
  initialValues: CompensationProfileFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    upsertCompensationProfileAction,
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
      <input type="hidden" name="staffId" value={values.staffId} />

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{staffName}</p>
        <p>Set the payroll basis and baseline rate used for payroll readiness and later calculations.</p>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="compensationPayBasis">Pay basis</Label>
          <NativeSelect
            id="compensationPayBasis"
            name="payBasis"
            value={values.payBasis}
            onChange={(event) =>
              updateFormValue("payBasis", event.target.value as CompensationProfileFormValues["payBasis"])
            }
          >
            {PAY_BASIS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="payBasis" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationEffectiveStartDate">Effective start date</Label>
          <Input
            id="compensationEffectiveStartDate"
            name="effectiveStartDate"
            type="date"
            value={values.effectiveStartDate}
            onChange={(event) => updateFormValue("effectiveStartDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="effectiveStartDate" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="compensationBaseRate">Base rate</Label>
          <Input
            id="compensationBaseRate"
            name="baseRate"
            inputMode="decimal"
            value={values.baseRate}
            onChange={(event) => updateFormValue("baseRate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="baseRate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationOvertimeRate">Overtime rate</Label>
          <Input
            id="compensationOvertimeRate"
            name="overtimeRate"
            inputMode="decimal"
            value={values.overtimeRate}
            onChange={(event) => updateFormValue("overtimeRate", event.target.value)}
            placeholder="Optional"
          />
          <FieldError errors={state.fieldErrors} name="overtimeRate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationAllowancePerPeriod">Allowance per period</Label>
          <Input
            id="compensationAllowancePerPeriod"
            name="allowancePerPeriod"
            inputMode="decimal"
            value={values.allowancePerPeriod}
            onChange={(event) => updateFormValue("allowancePerPeriod", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="allowancePerPeriod" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="compensationNotes">Notes</Label>
        <Textarea
          id="compensationNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional payroll setup note, role context, or special basis reminder."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving...">Save compensation</SubmitButton>
      </div>
    </form>
  );
}
