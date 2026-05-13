"use client";

import { useActionState } from "react";

import { FormSection } from "@/components/shared/form-section";
import { FormStatusMessage } from "@/components/shared/form-status";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateOperationalRulesSettingsAction } from "@/features/settings/actions/settings-actions";
import type { BusinessSettingsValues } from "@/features/settings/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function OperationalRulesForm({
  initialValues,
}: {
  initialValues: BusinessSettingsValues;
}) {
  const [state, formAction] = useActionState(
    updateOperationalRulesSettingsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    allowPartialPayments: initialValues.allowPartialPayments,
    allowReleaseWithBalance: initialValues.allowReleaseWithBalance,
    requireFullPaymentBeforeRelease: initialValues.requireFullPaymentBeforeRelease,
    requireAdditionalItemPreApproval: initialValues.requireAdditionalItemPreApproval,
    enableBarcodeSupport: initialValues.enableBarcodeSupport,
    enableShelfLocation: initialValues.enableShelfLocation,
  });

  return (
    <FormSection
      title="Operational rules"
      description="Payment, release, barcode, and shelf-location behavior."
    >
      <form action={formAction} className="space-y-4">
        <FormStatusMessage message={state.message} />

        <div className="space-y-3">
          <RuleToggle
            name="allowPartialPayments"
            title="Allow partial payments"
            description="Enable invoices and POS sales to be recorded with a remaining balance."
            checked={values.allowPartialPayments}
            onCheckedChange={(checked) => updateFormValue("allowPartialPayments", checked)}
          />
          <RuleToggle
            name="allowReleaseWithBalance"
            title="Allow release with balance"
            description="Permit vehicle release even if the invoice balance is not fully settled."
            checked={values.allowReleaseWithBalance}
            onCheckedChange={(checked) => updateFormValue("allowReleaseWithBalance", checked)}
          />
          <RuleToggle
            name="requireFullPaymentBeforeRelease"
            title="Require full payment before release"
            description="Keep release blocked unless the invoice is fully paid."
            checked={values.requireFullPaymentBeforeRelease}
            onCheckedChange={(checked) => updateFormValue("requireFullPaymentBeforeRelease", checked)}
          />
          <RuleToggle
            name="requireAdditionalItemPreApproval"
            title="Pre-approve additional work items"
            description="Require added job-order items to be approved before they can be used in parts usage."
            checked={values.requireAdditionalItemPreApproval}
            onCheckedChange={(checked) =>
              updateFormValue("requireAdditionalItemPreApproval", checked)
            }
          />
          <RuleToggle
            name="enableBarcodeSupport"
            title="Enable barcode support"
            description="Show barcode-aware behavior in the POS and catalog lookup flows."
            checked={values.enableBarcodeSupport}
            onCheckedChange={(checked) => updateFormValue("enableBarcodeSupport", checked)}
          />
          <RuleToggle
            name="enableShelfLocation"
            title="Enable shelf location"
            description="Make shelf location an active part of the stock-handling workflow."
            checked={values.enableShelfLocation}
            onCheckedChange={(checked) => updateFormValue("enableShelfLocation", checked)}
          />
        </div>

        <SubmitButton pendingLabel="Saving...">Save operational rules</SubmitButton>
      </form>
    </FormSection>
  );
}

function RuleToggle({
  name,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  name: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 transition-colors hover:bg-muted/25">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-1 size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
        />
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <StatusBadge tone={checked ? "success" : "neutral"}>
        {checked ? "Enabled" : "Disabled"}
      </StatusBadge>
    </label>
  );
}
