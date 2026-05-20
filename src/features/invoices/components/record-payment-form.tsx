"use client";

import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordInvoicePaymentAction } from "@/features/invoices/actions/invoice-actions";
import { PAYMENT_METHOD_OPTIONS } from "@/features/invoices/types";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
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
    amount: formatMoneyInputValue(balance),
    paymentMethod: "cash",
    referenceNumber: "",
    notes: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      {jobOrderId ? <input type="hidden" name="jobOrderId" value={jobOrderId} /> : null}

      <FormStatusMessage message={state.message} />

      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {allowPartialPayments
          ? "Partial payments are enabled for this branch."
          : "Partial payments are disabled. The payment must cover the full remaining balance."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.amount}
            onChange={(event) => updateFormValue("amount", event.target.value)}
          />
          <FieldError errors={state.fieldErrors} name="amount" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={values.paymentMethod}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => updateFormValue("paymentMethod", event.target.value)}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors} name="paymentMethod" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Reference number</Label>
          <Input id="referenceNumber" name="referenceNumber" value={values.referenceNumber} onChange={(event) => updateFormValue("referenceNumber", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="referenceNumber" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" value={values.notes} onChange={(event) => updateFormValue("notes", event.target.value)} />
          <FieldError errors={state.fieldErrors} name="notes" />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Record payment</SubmitButton>
      </div>
    </form>
  );
}
