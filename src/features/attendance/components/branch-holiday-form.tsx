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
import { upsertBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import type { BranchHolidayFormValues } from "@/features/attendance/types";
import {
  BRANCH_HOLIDAY_KIND_OPTIONS,
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
      <input type="hidden" name="holidayId" value={values.holidayId} />

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="holidayDate">Holiday date</Label>
          <Input
            id="holidayDate"
            name="holidayDate"
            type="date"
            value={values.holidayDate}
            onChange={(event) => updateFormValue("holidayDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="holidayDate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="holidayKind">Holiday type</Label>
          <NativeSelect
            id="holidayKind"
            name="holidayKind"
            value={values.holidayKind}
            onChange={(event) =>
              updateFormValue(
                "holidayKind",
                event.target.value as BranchHolidayFormValues["holidayKind"],
              )
            }
          >
            {BRANCH_HOLIDAY_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="holidayKind" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holidayLabel">Label</Label>
        <Input
          id="holidayLabel"
          name="label"
          value={values.label}
          onChange={(event) => updateFormValue("label", event.target.value)}
          placeholder="Araw ng Kagitingan, Special non-working day, branch inventory day..."
        />
        <FieldError errors={state.fieldErrors} name="label" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="holidayNotes">Notes</Label>
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
        <SubmitButton pendingLabel="Saving...">Save holiday</SubmitButton>
      </div>
    </form>
  );
}
