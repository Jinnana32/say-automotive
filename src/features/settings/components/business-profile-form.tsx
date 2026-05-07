"use client";

import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { FormSection } from "@/components/shared/form-section";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfileSettingsAction } from "@/features/settings/actions/settings-actions";
import type { BusinessSettingsValues } from "@/features/settings/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function BusinessProfileForm({
  initialValues,
}: {
  initialValues: BusinessSettingsValues;
}) {
  const [state, formAction] = useActionState(
    updateBusinessProfileSettingsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    businessName: initialValues.businessName,
    businessContact: initialValues.businessContact,
    businessAddress: initialValues.businessAddress,
    defaultTaxRate: initialValues.defaultTaxRate,
    receiptFooter: initialValues.receiptFooter,
  });

  return (
    <FormSection
      title="Business profile"
      description="Values used on invoices, POS receipts, and printed shop documents."
    >
      <form action={formAction} className="space-y-5">
        <FormStatusMessage message={state.message} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
              <Input
              id="businessName"
              name="businessName"
              value={values.businessName}
              onChange={(event) => updateFormValue("businessName", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="businessName" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessContact">Business contact</Label>
              <Input
              id="businessContact"
              name="businessContact"
              value={values.businessContact}
              onChange={(event) => updateFormValue("businessContact", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="businessContact" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business address</Label>
          <Textarea
            id="businessAddress"
            name="businessAddress"
            value={values.businessAddress}
            onChange={(event) => updateFormValue("businessAddress", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="businessAddress" />
        </div>

        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default tax rate (%)</Label>
            <Input
              id="defaultTaxRate"
              name="defaultTaxRate"
              inputMode="decimal"
              value={values.defaultTaxRate}
              onChange={(event) => updateFormValue("defaultTaxRate", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="defaultTaxRate" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Receipt footer</Label>
            <Textarea
              id="receiptFooter"
              name="receiptFooter"
              value={values.receiptFooter}
              onChange={(event) => updateFormValue("receiptFooter", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="receiptFooter" />
          </div>
        </div>

        <SubmitButton pendingLabel="Saving...">Save business profile</SubmitButton>
      </form>
    </FormSection>
  );
}
