"use client";

import { useActionState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordInvoicePaymentAction } from "@/features/invoices/actions/invoice-actions";
import { PAYMENT_METHOD_OPTIONS } from "@/features/invoices/types";
import { formatNumberForInput, MONEY_INPUT_STEP } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function RecordPaymentForm({
  invoiceId,
  jobOrderId,
  balance,
  allowPartialPayments,
}: {
  invoiceId: string;
  jobOrderId: string | null;
  balance: number;
  allowPartialPayments: boolean;
}) {
  const [state, formAction] = useActionState(recordInvoicePaymentAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    amount: formatNumberForInput(balance, { maxDecimals: 2 }),
    paymentMethod: "cash",
    referenceNumber: "",
    notes: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      {jobOrderId ? <input type="hidden" name="jobOrderId" value={jobOrderId} /> : null}

      <FormStatusMessage message={state.message} />
      <FormRequiredFieldsNote />

      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {allowPartialPayments
          ? "Partial payments are enabled for this branch."
          : "Partial payments are disabled. The payment must cover the full remaining balance."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount" required>
            Amount
          </Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.amount}
            onChange={(event) => updateFormValue("amount", event.target.value)}
            className={fieldControlClassName(state.fieldErrors, "amount")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "amount",
              required: true,
              errorId: fieldErrorId("amount"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="amount" id={fieldErrorId("amount")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod" required>
            Payment method
          </Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={values.paymentMethod}
            className={formSelectClassName(state.fieldErrors, "paymentMethod")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "paymentMethod",
              required: true,
              errorId: fieldErrorId("paymentMethod"),
            })}
            onChange={(event) => updateFormValue("paymentMethod", event.target.value)}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors} name="paymentMethod" id={fieldErrorId("paymentMethod")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="referenceNumber" optional>Reference number</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            value={values.referenceNumber}
            className={fieldControlClassName(state.fieldErrors, "referenceNumber")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "referenceNumber",
              required: false,
              errorId: fieldErrorId("referenceNumber"),
            })}
            onChange={(event) => updateFormValue("referenceNumber", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="referenceNumber" id={fieldErrorId("referenceNumber")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" optional>Notes</Label>
          <Input
            id="notes"
            name="notes"
            value={values.notes}
            className={fieldControlClassName(state.fieldErrors, "notes")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "notes",
              required: false,
              errorId: fieldErrorId("notes"),
            })}
            onChange={(event) => updateFormValue("notes", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="notes" id={fieldErrorId("notes")} />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Record payment</SubmitButton>
      </div>
    </form>
  );
}
