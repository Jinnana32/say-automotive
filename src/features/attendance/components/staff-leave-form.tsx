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

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="space-y-2">
        <Label htmlFor="leaveStaffId">Staff member</Label>
        <NativeSelect
          id="leaveStaffId"
          name="staffId"
          value={values.staffId}
          onChange={(event) => updateFormValue("staffId", event.target.value)}
        >
          <option value="">Select a staff member</option>
          {activeStaff.map((staffOption) => (
            <option key={staffOption.id} value={staffOption.id}>
              {staffOption.fullName} · {formatStaffRoleLabel(staffOption.role)}
            </option>
          ))}
        </NativeSelect>
        <FieldError errors={state.fieldErrors} name="staffId" />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="leaveStartDate">Start date</Label>
          <Input
            id="leaveStartDate"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={(event) => updateFormValue("startDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="startDate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaveEndDate">End date</Label>
          <Input
            id="leaveEndDate"
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={(event) => updateFormValue("endDate", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="endDate" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaveType">Leave type</Label>
          <NativeSelect
            id="leaveType"
            name="leaveType"
            value={values.leaveType}
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
          <FieldError errors={state.fieldErrors} name="leaveType" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leaveNotes">Notes</Label>
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
