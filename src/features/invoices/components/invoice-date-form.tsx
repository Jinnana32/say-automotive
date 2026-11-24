"use client";

import { useActionState, useState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { updateInvoiceDateAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function InvoiceDateForm({
  invoiceId,
  invoiceDate,
}: {
  invoiceId: string;
  invoiceDate: string;
}) {
  const [state, formAction] = useActionState(updateInvoiceDateAction, INITIAL_FORM_ACTION_STATE);
  const initialDate = invoiceDate.slice(0, 10);
  const [value, setValue] = useState(initialDate);
  const isDirty = value !== initialDate;

  return (
    <form action={formAction} className="space-y-1.5 font-normal">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="flex items-center gap-2">
        <Input
          id="invoiceDate"
          name="invoiceDate"
          type="date"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cn(
            "h-10 w-auto min-w-[10.5rem] max-w-full shrink-0 font-semibold",
            fieldControlClassName(state.fieldErrors, "invoiceDate"),
          )}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "invoiceDate",
            required: true,
            errorId: fieldErrorId("invoiceDate"),
          })}
        />
        {isDirty ? (
          <SubmitButton
            size="sm"
            variant="outlineBlue"
            className="h-10 shrink-0 px-3"
            pendingLabel="Saving..."
          >
            Save
          </SubmitButton>
        ) : null}
      </div>
      <FieldError errors={state.fieldErrors} name="invoiceDate" id={fieldErrorId("invoiceDate")} />
      <FormStatusMessage message={state.message} />
    </form>
  );
}
