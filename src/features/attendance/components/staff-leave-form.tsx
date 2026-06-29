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
import { upsertStaffLeaveEntryAction } from "@/features/attendance/actions/timekeeping-actions";
import type {
  StaffLeaveFormValues,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";
import {
  INITIAL_TIMEKEEPING_ACTION_STATE,
  STAFF_LEAVE_TYPE_OPTIONS,
  formatStaffRoleLabel,
} from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

export function StaffLeaveForm({
  initialValues,
  activeStaff,
  closeDialog,
}: {
  initialValues: StaffLeaveFormValues;
  activeStaff: TimekeepingCalendarStaffOption[];
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    upsertStaffLeaveEntryAction,
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
      <input type="hidden" name="leaveEntryId" value={values.leaveEntryId} />

      <FormRequiredFieldsNote />
      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="space-y-2">
        <Label htmlFor="leaveStaffId" required>
          Staff member
        </Label>
        <NativeSelect
          id="leaveStaffId"
          name="staffId"
          value={values.staffId}
          className={fieldControlClassName(state.fieldErrors, "staffId")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "staffId",
            required: true,
            errorId: fieldErrorId("staffId"),
          })}
          onChange={(event) => updateFormValue("staffId", event.target.value)}
        >
          <option value="">Select a staff member</option>
          {activeStaff.map((staffOption) => (
            <option key={staffOption.id} value={staffOption.id}>
              {staffOption.fullName} · {formatStaffRoleLabel(staffOption.role)}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="staffId" id={fieldErrorId("staffId")} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="leaveStartDate" required>
            Start date
          </Label>
          <Input
            id="leaveStartDate"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={(event) => updateFormValue("startDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "startDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "startDate",
              required: true,
              errorId: fieldErrorId("startDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="startDate" id={fieldErrorId("startDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaveEndDate" required>
            End date
          </Label>
          <Input
            id="leaveEndDate"
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={(event) => updateFormValue("endDate", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "endDate")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "endDate",
              required: true,
              errorId: fieldErrorId("endDate"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="endDate" id={fieldErrorId("endDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaveType" required>
            Leave type
          </Label>
          <NativeSelect
            id="leaveType"
            name="leaveType"
            value={values.leaveType}
            className={fieldControlClassName(state.fieldErrors, "leaveType")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "leaveType",
              required: true,
              errorId: fieldErrorId("leaveType"),
            })}
            onChange={(event) =>
              updateFormValue(
                "leaveType",
                event.target.value as StaffLeaveFormValues["leaveType"],
              )
            }
          >
            {STAFF_LEAVE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={state.fieldErrors} name="leaveType" id={fieldErrorId("leaveType")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leaveNotes" optional>Notes</Label>
        <Textarea
          id="leaveNotes"
          name="notes"
          value={values.notes}
          onChange={(event) => updateFormValue("notes", event.target.value)}
          placeholder="Optional note, medical follow-up, travel reason, or payroll context."
        />
        <FieldError errors={state.fieldErrors} name="notes" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving...">Save leave</SubmitButton>
      </div>
    </form>
  );
}
