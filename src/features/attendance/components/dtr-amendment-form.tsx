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
import { submitDtrAmendmentAction } from "@/features/attendance/actions/mechanic-portal-actions";
import type { DtrAmendmentFormValues } from "@/features/attendance/types";
import {
  ATTENDANCE_LOG_TYPE_OPTIONS,
  DTR_AMENDMENT_TYPE_OPTIONS,
  INITIAL_TIMEKEEPING_ACTION_STATE,
} from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

export function DtrAmendmentForm({
  initialValues,
  closeDialog,
}: {
  initialValues: DtrAmendmentFormValues;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    submitDtrAmendmentAction,
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
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Amendment requests are reviewed by the owner or admin before they affect payroll-ready attendance.
      </div>

      <FormRequiredFieldsNote />
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dtrAttendanceDate" required>
            Attendance date
          </Label>
          <Input
            id="dtrAttendanceDate"
            type="date"
            name="attendanceDate"
            value={values.attendanceDate}
            onChange={(event) => updateFormValue("attendanceDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "attendanceDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "attendanceDate",
              required: true,
              errorId: fieldErrorId("attendanceDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="attendanceDate" id={fieldErrorId("attendanceDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dtrTargetLogType" required>
            Attendance action
          </Label>
          <NativeSelect
            id="dtrTargetLogType"
            name="targetLogType"
            value={values.targetLogType}
            className={fieldControlClassName(state.fieldErrors, "targetLogType")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "targetLogType",
              required: true,
              errorId: fieldErrorId("targetLogType"),
            })}
            onChange={(event) => {
              const nextTargetLogType = event.target.value as DtrAmendmentFormValues["targetLogType"];
              updateFormValue("targetLogType", nextTargetLogType);
              if (
                values.amendmentType === "missed_time_in" &&
                nextTargetLogType === "time_out"
              ) {
                updateFormValue("amendmentType", "missed_time_out");
              }
              if (
                values.amendmentType === "missed_time_out" &&
                nextTargetLogType === "time_in"
              ) {
                updateFormValue("amendmentType", "missed_time_in");
              }
            }}
          >
            {ATTENDANCE_LOG_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="targetLogType" id={fieldErrorId("targetLogType")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dtrAmendmentType" required>
            Amendment type
          </Label>
          <NativeSelect
            id="dtrAmendmentType"
            name="amendmentType"
            value={values.amendmentType}
            className={fieldControlClassName(state.fieldErrors, "amendmentType")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "amendmentType",
              required: true,
              errorId: fieldErrorId("amendmentType"),
            })}
            onChange={(event) =>
              updateFormValue(
                "amendmentType",
                event.target.value as DtrAmendmentFormValues["amendmentType"],
              )
            }
          >
            {DTR_AMENDMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="amendmentType" id={fieldErrorId("amendmentType")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dtrRequestedTime" required>
            Requested time
          </Label>
          <Input
            id="dtrRequestedTime"
            type="time"
            name="requestedTime"
            value={values.requestedTime}
            onChange={(event) => updateFormValue("requestedTime", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "requestedTime")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "requestedTime",
              required: true,
              errorId: fieldErrorId("requestedTime"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="requestedTime" id={fieldErrorId("requestedTime")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dtrReason" required>
          Reason
        </Label>
        <Textarea
          id="dtrReason"
          name="reason"
          value={values.reason}
          onChange={(event) => updateFormValue("reason", event.target.value)}
          placeholder="Explain what happened, including whether you were off the shop network or missed the portal punch."
          className={fieldControlClassName(state.fieldErrors, "reason")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "reason",
            required: true,
            errorId: fieldErrorId("reason"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="reason" id={fieldErrorId("reason")} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Submitting...">Submit amendment</SubmitButton>
      </div>
    </form>
  );
}
