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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { upsertCompensationProfileAction } from "@/features/payroll/actions/payroll-actions";
import type { CompensationProfileFormValues } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE, PAY_BASIS_OPTIONS } from "@/features/payroll/utils";
import { MONEY_INPUT_STEP } from "@/lib/currency";
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

      <FormRequiredFieldsNote />
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="compensationPayBasis" required>
            Pay basis
          </Label>
          <NativeSelect
            id="compensationPayBasis"
            name="payBasis"
            value={values.payBasis}
            className={fieldControlClassName(state.fieldErrors, "payBasis")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "payBasis",
              required: true,
              errorId: fieldErrorId("payBasis"),
            })}
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
          <FieldError errors={state.fieldErrors} name="payBasis" id={fieldErrorId("payBasis")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationEffectiveStartDate" required>
            Effective start date
          </Label>
          <Input
            id="compensationEffectiveStartDate"
            name="effectiveStartDate"
            type="date"
            value={values.effectiveStartDate}
            onChange={(event) => updateFormValue("effectiveStartDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "effectiveStartDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "effectiveStartDate",
              required: true,
              errorId: fieldErrorId("effectiveStartDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="effectiveStartDate" id={fieldErrorId("effectiveStartDate")} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="compensationBaseRate" required>
            Base rate
          </Label>
          <Input
            id="compensationBaseRate"
            name="baseRate"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.baseRate}
            onChange={(event) => updateFormValue("baseRate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "baseRate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "baseRate",
              required: true,
              errorId: fieldErrorId("baseRate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="baseRate" id={fieldErrorId("baseRate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationOvertimeRate">Overtime rate</Label>
          <Input
            id="compensationOvertimeRate"
            name="overtimeRate"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.overtimeRate}
            className={fieldControlClassName(state.fieldErrors, "overtimeRate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "overtimeRate",
              required: false,
              errorId: fieldErrorId("overtimeRate"),
            })}
            onChange={(event) => updateFormValue("overtimeRate", event.target.value)}
            placeholder="Optional"
          />
          <FieldError errors={state.fieldErrors} name="overtimeRate" id={fieldErrorId("overtimeRate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compensationAllowancePerPeriod" required>
            Allowance per period
          </Label>
          <Input
            id="compensationAllowancePerPeriod"
            name="allowancePerPeriod"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.allowancePerPeriod}
            onChange={(event) => updateFormValue("allowancePerPeriod", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "allowancePerPeriod")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "allowancePerPeriod",
              required: true,
              errorId: fieldErrorId("allowancePerPeriod"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="allowancePerPeriod" id={fieldErrorId("allowancePerPeriod")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="compensationNotes">Notes</Label>
        <Textarea
          id="compensationNotes"
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
          placeholder="Optional payroll setup note, role context, or special basis reminder."
        />
        <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
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
