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
import { upsertBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import type { BranchHolidayFormValues } from "@/features/attendance/types";
import {
  BRANCH_HOLIDAY_KIND_OPTIONS,
  BRANCH_HOLIDAY_PAY_TREATMENT_OPTIONS,
  getDefaultPayTreatmentForBranchHolidayKind,
  INITIAL_TIMEKEEPING_ACTION_STATE,
} from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

export function BranchHolidayForm({
  initialValues,
  closeDialog,
}: {
  initialValues: BranchHolidayFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    upsertBranchHolidayAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const { setValues, values, updateFormValue } = useFormValues(initialValues);
  const payTreatmentHelperText =
    values.holidayKind === "branch_closure"
      ? "Branch closure means attendance is not required. It is unpaid by default unless marked as paid."
      : values.holidayKind === "public_holiday"
        ? "Holiday pay rules should be confirmed with management or accounting before payroll calculation."
        : values.holidayKind === "company_holiday"
          ? "Company holidays stay unpaid unless management explicitly marks them as a paid regular day."
          : "Use a custom pay rule only when the branch needs a manual payroll treatment later.";

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    closeDialog();
    router.refresh();
  }, [closeDialog, router, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="holidayId" value={values.holidayId} />

      <FormRequiredFieldsNote />
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="holidayDate" required>
            Calendar date
          </Label>
          <Input
            id="holidayDate"
            name="holidayDate"
            type="date"
            value={values.holidayDate}
            onChange={(event) => updateFormValue("holidayDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "holidayDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "holidayDate",
              required: true,
              errorId: fieldErrorId("holidayDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="holidayDate" id={fieldErrorId("holidayDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="holidayKind" required>
            Event type
          </Label>
          <NativeSelect
            id="holidayKind"
            name="holidayKind"
            value={values.holidayKind}
            className={fieldControlClassName(state.fieldErrors, "holidayKind")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "holidayKind",
              required: true,
              errorId: fieldErrorId("holidayKind"),
            })}
            onChange={(event) =>
              setValues((currentValues) => {
                const nextHolidayKind = event.target.value as BranchHolidayFormValues["holidayKind"];

                return {
                  ...currentValues,
                  holidayKind: nextHolidayKind,
                  payTreatment:
                    nextHolidayKind === "branch_closure"
                      ? getDefaultPayTreatmentForBranchHolidayKind(nextHolidayKind)
                      : currentValues.payTreatment,
                };
              })
            }
          >
            {BRANCH_HOLIDAY_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="holidayKind" id={fieldErrorId("holidayKind")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payTreatment" required>
            Pay treatment
          </Label>
          <NativeSelect
            id="payTreatment"
            name="payTreatment"
            value={values.payTreatment}
            className={fieldControlClassName(state.fieldErrors, "payTreatment")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "payTreatment",
              required: true,
              errorId: fieldErrorId("payTreatment"),
            })}
            onChange={(event) =>
              updateFormValue(
                "payTreatment",
                event.target.value as BranchHolidayFormValues["payTreatment"],
              )
            }
          >
            {BRANCH_HOLIDAY_PAY_TREATMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">{payTreatmentHelperText}</p>
          <FieldError errors={state.fieldErrors} name="payTreatment" id={fieldErrorId("payTreatment")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holidayLabel" required>
          Label or reason
        </Label>
        <Input
          id="holidayLabel"
          name="label"
          value={values.label}
          onChange={(event) => updateFormValue("label", event.target.value)}
          placeholder="Shop maintenance, Araw ng Kagitingan, company outing..."
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

      <div className="space-y-2">
        <Label htmlFor="holidayNotes" optional>Notes</Label>
        <Textarea
          id="holidayNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional internal note for payroll and attendance review."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving...">Save calendar date</SubmitButton>
      </div>
    </form>
  );
}
