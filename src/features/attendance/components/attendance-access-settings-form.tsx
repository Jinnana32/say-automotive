"use client";

import { useActionState } from "react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateAttendanceAccessSettingsAction } from "@/features/attendance/actions/timekeeping-actions";
import type { AttendanceAccessSettingsFormValues } from "@/features/attendance/types";
import { INITIAL_TIMEKEEPING_ACTION_STATE } from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

const SETTING_FIELDS: Array<{
  key: keyof AttendanceAccessSettingsFormValues;
  label: string;
  description: string;
}> = [
  {
    key: "requireShopIpForMechanicAttendance",
    label: "Require approved shop IP for mechanic punches",
    description:
      "Mechanic time in and time out are blocked unless the request comes from an approved branch IP address.",
  },
  {
    key: "allowDtrAmendments",
    label: "Allow DTR amendments",
    description:
      "Mechanics can file amendment requests when they miss a punch or are off the approved network.",
  },
  {
    key: "allowAttendanceAdminOverride",
    label: "Allow admin attendance override",
    description:
      "Owners and admins may still correct attendance directly from the admin attendance roster when needed.",
  },
];

export function AttendanceAccessSettingsForm({
  initialValues,
}: {
  initialValues: AttendanceAccessSettingsFormValues;
}) {
  const [state, formAction] = useActionState(
    updateAttendanceAccessSettingsAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        {SETTING_FIELDS.map((field) => (
          <label
            key={field.key}
            className="flex gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4"
          >
            <input
              type="checkbox"
              name={field.key}
              checked={values[field.key]}
              onChange={(event) => updateFormValue(field.key, event.target.checked)}
              className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{field.label}</p>
              <p className="text-sm text-muted-foreground">{field.description}</p>
            </div>
          </label>
        ))}
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
      {state.status === "success" ? (
        <p className="text-sm text-emerald-700">{state.message}</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving...">Save access rules</SubmitButton>
      </div>
    </form>
  );
}
