"use client";

import { useActionState, useEffect } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAttendanceAllowedIpAction } from "@/features/attendance/actions/timekeeping-actions";
import type { AttendanceAllowedIpFormValues } from "@/features/attendance/types";
import { INITIAL_TIMEKEEPING_ACTION_STATE } from "@/features/attendance/utils";
import { useFormValues } from "@/lib/use-form-values";

export function AttendanceAllowedIpForm({
  currentDetectedIp,
}: {
  currentDetectedIp: string | null;
}) {
  const [state, formAction] = useActionState(
    addAttendanceAllowedIpAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const { values, setValues, updateFormValue } = useFormValues<AttendanceAllowedIpFormValues>({
    ipAddress: "",
    label: "",
  });

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setValues({
      ipAddress: "",
      label: "",
    });
  }, [setValues, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="attendanceAllowedIpAddress">Public IP address</Label>
          <Input
            id="attendanceAllowedIpAddress"
            name="ipAddress"
            value={values.ipAddress}
            onChange={(event) => updateFormValue("ipAddress", event.target.value)}
            placeholder="203.0.113.10"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Register the public internet IP seen by the server, not the phone&apos;s local Wi-Fi
            address like <span className="font-medium">192.168.1.9</span>.
          </p>
          <FieldError errors={state.fieldErrors} name="ipAddress" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendanceAllowedIpLabel">Label</Label>
          <Input
            id="attendanceAllowedIpLabel"
            name="label"
            value={values.label}
            onChange={(event) => updateFormValue("label", event.target.value)}
            placeholder="Main fiber line"
          />
          <FieldError errors={state.fieldErrors} name="label" />
        </div>

        <div className="flex items-end gap-2">
          {currentDetectedIp ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => updateFormValue("ipAddress", currentDetectedIp)}
            >
              Use detected public IP
            </Button>
          ) : null}
          <SubmitButton pendingLabel="Adding...">Add IP</SubmitButton>
        </div>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
      {state.status === "success" ? (
        <p className="text-sm text-emerald-700">{state.message}</p>
      ) : null}
    </form>
  );
}
