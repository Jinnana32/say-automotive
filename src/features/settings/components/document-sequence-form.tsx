"use client";

import { useActionState } from "react";

import { FormSection } from "@/components/shared/form-section";
import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDocumentSequenceSettingsAction } from "@/features/settings/actions/settings-actions";
import type { SettingsDocumentSequence } from "@/features/settings/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function DocumentSequenceForm({
  sequence,
}: {
  sequence: SettingsDocumentSequence;
}) {
  const [state, formAction] = useActionState(
    updateDocumentSequenceSettingsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    prefix: sequence.prefix,
    padding: String(sequence.padding),
    lastValue: String(sequence.lastValue),
  });

  return (
    <FormSection
      title={sequence.label}
      description="Prefix, zero padding, and current counter value."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="key" value={sequence.key} />
        <FormStatusMessage message={state.message} />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${sequence.key}-prefix`}>Prefix</Label>
            <Input
              id={`${sequence.key}-prefix`}
              name="prefix"
              value={values.prefix}
              onChange={(event) => updateFormValue("prefix", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="prefix" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${sequence.key}-padding`}>Padding</Label>
            <Input
              id={`${sequence.key}-padding`}
              name="padding"
              inputMode="numeric"
              value={values.padding}
              onChange={(event) => updateFormValue("padding", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="padding" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${sequence.key}-lastValue`}>Last value</Label>
            <Input
              id={`${sequence.key}-lastValue`}
              name="lastValue"
              inputMode="numeric"
              value={values.lastValue}
              onChange={(event) => updateFormValue("lastValue", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="lastValue" />
          </div>
        </div>

        <SubmitButton pendingLabel="Saving...">Save sequence</SubmitButton>
      </form>
    </FormSection>
  );
}
