"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertStaffScheduleAction } from "@/features/attendance/actions/attendance-actions";
import type { StaffScheduleFormValues } from "@/features/attendance/types";
import { INITIAL_ATTENDANCE_ENTRY_ACTION_STATE } from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

const WORKDAY_FIELDS: Array<{
  key: keyof Pick<
    StaffScheduleFormValues,
    | "mondayIsWorkday"
    | "tuesdayIsWorkday"
    | "wednesdayIsWorkday"
    | "thursdayIsWorkday"
    | "fridayIsWorkday"
    | "saturdayIsWorkday"
    | "sundayIsWorkday"
  >;
  label: string;
}> = [
  { key: "mondayIsWorkday", label: "Mon" },
  { key: "tuesdayIsWorkday", label: "Tue" },
  { key: "wednesdayIsWorkday", label: "Wed" },
  { key: "thursdayIsWorkday", label: "Thu" },
  { key: "fridayIsWorkday", label: "Fri" },
  { key: "saturdayIsWorkday", label: "Sat" },
  { key: "sundayIsWorkday", label: "Sun" },
];

export function StaffScheduleForm({
  staffName,
  initialValues,
  closeDialog,
}: {
  staffName: string;
  initialValues: StaffScheduleFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    upsertStaffScheduleAction,
    INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
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
        <p>Use weekly schedules to define expected workdays and make payroll attendance gaps obvious.</p>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="scheduleShiftStartTime">Shift start</Label>
          <Input
            id="scheduleShiftStartTime"
            name="shiftStartTime"
            type="time"
            value={values.shiftStartTime}
            onChange={(event) => updateFormValue("shiftStartTime", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="shiftStartTime" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduleShiftEndTime">Shift end</Label>
          <Input
            id="scheduleShiftEndTime"
            name="shiftEndTime"
            type="time"
            value={values.shiftEndTime}
            onChange={(event) => updateFormValue("shiftEndTime", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="shiftEndTime" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduleGraceMinutes">Grace minutes</Label>
          <Input
            id="scheduleGraceMinutes"
            name="graceMinutes"
            inputMode="numeric"
            value={values.graceMinutes}
            onChange={(event) => updateFormValue("graceMinutes", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="graceMinutes" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Working days</p>
          <p className="text-sm text-muted-foreground">Select the days this staff member is expected to work.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {WORKDAY_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/15 px-3 py-3 text-sm text-foreground"
            >
              <input
                type="checkbox"
                name={field.key}
                checked={values[field.key]}
                onChange={(event) => updateFormValue(field.key, event.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
        <FieldError errors={state.fieldErrors} name="mondayIsWorkday" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduleNotes">Notes</Label>
        <Textarea
          id="scheduleNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional shift note, rest-day arrangement, or special timing reminder."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving...">Save schedule</SubmitButton>
      </div>
    </form>
  );
}
