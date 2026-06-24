"use client";

import { useActionState } from "react";

import { FormSection } from "@/components/shared/form-section";
import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    allowGlobalProductCatalog: initialValues.allowGlobalProductCatalog,
    allowGlobalServiceCatalog: initialValues.allowGlobalServiceCatalog,
    allowPartialPayments: initialValues.allowPartialPayments,
    requireInvoiceBeforeJobCompletion:
      initialValues.requireInvoiceBeforeJobCompletion,
    requireInvoiceBeforeVehicleRelease:
      initialValues.requireInvoiceBeforeVehicleRelease,
    allowReleaseWithBalance: initialValues.allowReleaseWithBalance,
    requireFullPaymentBeforeRelease: initialValues.requireFullPaymentBeforeRelease,
    requireAdditionalItemPreApproval: initialValues.requireAdditionalItemPreApproval,
    enableBarcodeSupport: initialValues.enableBarcodeSupport,
    enableShelfLocation: initialValues.enableShelfLocation,
    payrollStandardDailyHours: initialValues.payrollStandardDailyHours,
    payrollHolidayPremiumRate: initialValues.payrollHolidayPremiumRate,
  });

  return (
    <FormSection
      title="Operational rules"
      description="Payment, release, barcode, and shelf-location behavior."
    >
      <form action={formAction} className="space-y-4">
        <FormRequiredFieldsNote />
        <FormStatusMessage message={state.message} />

        <div className="space-y-3">
          <RuleToggle
            name="allowGlobalProductCatalog"
            title="Allow global product catalog"
            description="Let this branch see products marked as global by authorized catalog managers."
            checked={values.allowGlobalProductCatalog}
            onCheckedChange={(checked) => updateFormValue("allowGlobalProductCatalog", checked)}
          />
          <RuleToggle
            name="allowGlobalServiceCatalog"
            title="Allow global service catalog"
            description="Let this branch see services marked as global by authorized catalog managers."
            checked={values.allowGlobalServiceCatalog}
            onCheckedChange={(checked) => updateFormValue("allowGlobalServiceCatalog", checked)}
          />
          <RuleToggle
            name="allowPartialPayments"
            title="Allow partial payments"
            description="Enable invoices and POS sales to be recorded with a remaining balance."
            checked={values.allowPartialPayments}
            onCheckedChange={(checked) => updateFormValue("allowPartialPayments", checked)}
          />
          <RuleToggle
            name="requireInvoiceBeforeJobCompletion"
            title="Require invoice before job completion"
            description="Keep job orders from moving into Completed until an invoice has been generated."
            checked={values.requireInvoiceBeforeJobCompletion}
            onCheckedChange={(checked) =>
              updateFormValue("requireInvoiceBeforeJobCompletion", checked)
            }
          />
          <RuleToggle
            name="requireInvoiceBeforeVehicleRelease"
            title="Require invoice before vehicle release"
            description="Block vehicle release when no invoice has been generated for the job order."
            checked={values.requireInvoiceBeforeVehicleRelease}
            onCheckedChange={(checked) =>
              updateFormValue("requireInvoiceBeforeVehicleRelease", checked)
            }
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

        <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payrollStandardDailyHours" required>
              Standard daily hours
            </Label>
            <Input
              id="payrollStandardDailyHours"
              name="payrollStandardDailyHours"
              inputMode="decimal"
              value={values.payrollStandardDailyHours}
              onChange={(event) => updateFormValue("payrollStandardDailyHours", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "payrollStandardDailyHours")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "payrollStandardDailyHours",
                required: true,
                errorId: fieldErrorId("payrollStandardDailyHours"),
              })}
            />
            <p className="text-sm text-muted-foreground">
              Used to convert daily salary into an hourly rate for overtime and late deductions.
            </p>
            <FieldError errors={state.fieldErrors} name="payrollStandardDailyHours" id={fieldErrorId("payrollStandardDailyHours")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payrollHolidayPremiumRate" required>
              Holiday premium (%)
            </Label>
            <Input
              id="payrollHolidayPremiumRate"
              name="payrollHolidayPremiumRate"
              inputMode="decimal"
              value={values.payrollHolidayPremiumRate}
              onChange={(event) => updateFormValue("payrollHolidayPremiumRate", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "payrollHolidayPremiumRate")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "payrollHolidayPremiumRate",
                required: true,
                errorId: fieldErrorId("payrollHolidayPremiumRate"),
              })}
            />
            <p className="text-sm text-muted-foreground">
              Extra percentage paid only when a staff member actually works on a holiday date.
            </p>
            <FieldError errors={state.fieldErrors} name="payrollHolidayPremiumRate" id={fieldErrorId("payrollHolidayPremiumRate")} />
          </div>
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
