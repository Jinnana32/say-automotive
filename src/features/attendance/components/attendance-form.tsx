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
import { upsertAttendanceRecordAction } from "@/features/attendance/actions/attendance-actions";
import type { AttendanceFormValues } from "@/features/attendance/types";
import { ATTENDANCE_STATUS_OPTIONS, INITIAL_ATTENDANCE_ENTRY_ACTION_STATE } from "@/features/attendance/utils";
import { formatDate } from "@/lib/dates";
import { useFormValues } from "@/lib/use-form-values";

export function AttendanceForm({
  staffName,
  initialValues,
  closeDialog,
}: {
  staffName: string;
  initialValues: AttendanceFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    upsertAttendanceRecordAction,
    INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);
  const timeFieldsDisabled = values.status === "absent";

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
      <input type="hidden" name="attendanceDate" value={values.attendanceDate} />

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{staffName}</p>
        <p>Attendance date {formatDate(values.attendanceDate)}</p>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="attendanceStatus">Status</Label>
          <NativeSelect
            id="attendanceStatus"
            name="status"
            value={values.status}
            onChange={(event) => {
              const nextStatus = event.target.value as AttendanceFormValues["status"];
              updateFormValue("status", nextStatus);

              if (nextStatus === "absent") {
                updateFormValue("timeIn", "");
                updateFormValue("timeOut", "");
              }
            }}
          >
            {ATTENDANCE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="status" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attendanceTimeIn">Time in</Label>
            <Input
              id="attendanceTimeIn"
              name="timeIn"
              type="datetime-local"
              disabled={timeFieldsDisabled}
              value={values.timeIn}
              onChange={(event) => updateFormValue("timeIn", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="timeIn" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendanceTimeOut">Time out</Label>
            <Input
              id="attendanceTimeOut"
              name="timeOut"
              type="datetime-local"
              disabled={timeFieldsDisabled}
              value={values.timeOut}
              onChange={(event) => updateFormValue("timeOut", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="timeOut" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendanceNotes">Notes</Label>
        <Textarea
          id="attendanceNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional shift note, late reason, or follow-up detail."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving...">Save attendance</SubmitButton>
      </div>
    </form>
  );
}
