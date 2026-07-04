"use client";

import { useActionState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  recordJobOrderPartReturnAction,
  recordJobOrderPartUsageAction,
} from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab } from "@/features/job-orders/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function JobOrderPartUsageForm({
  mode,
  jobOrderId,
  jobOrderItemId,
  maxQuantity,
  redirectTab,
}: {
  mode: "use" | "return";
  jobOrderId: string;
  jobOrderItemId: string;
  maxQuantity: number;
  redirectTab: JobOrderDetailTab;
}) {
  const [state, formAction] = useActionState(
    mode === "use" ? recordJobOrderPartUsageAction : recordJobOrderPartReturnAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues({
    quantity: getDefaultQuantity(maxQuantity),
    notes: "",
  });
  const isDisabled = maxQuantity <= 0;

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="jobOrderItemId" value={jobOrderItemId} />
      <input type="hidden" name="redirectTab" value={redirectTab} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{mode === "use" ? "Use part" : "Return part"}</p>
          <p className="text-xs text-muted-foreground">
            {mode === "use"
              ? `Available to use now: ${maxQuantity}`
              : `Available to return now: ${maxQuantity}`}
          </p>
        </div>
      </div>

      <FormStatusMessage message={state.message} />

      <div className="grid gap-3 lg:grid-cols-[160px_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-quantity-${jobOrderItemId}`} required>
            Quantity
          </Label>
          <Input
            id={`${mode}-quantity-${jobOrderItemId}`}
            name="quantity"
            inputMode="decimal"
            value={values.quantity}
            onChange={(event) => updateFormValue("quantity", event.target.value)}
            disabled={isDisabled}
            className={fieldControlClassName(state.fieldErrors, "quantity")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "quantity",
              required: true,
              errorId: fieldErrorId("quantity"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="quantity" id={fieldErrorId("quantity")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-notes-${jobOrderItemId}`} optional>
            Notes
          </Label>
          <Input
            id={`${mode}-notes-${jobOrderItemId}`}
            name="notes"
            placeholder={mode === "use" ? "Optional usage note" : "Optional return note"}
            value={values.notes}
            disabled={isDisabled}
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

        <div className="flex items-end">
          <SubmitButton disabled={isDisabled}>
            {mode === "use" ? "Record usage" : "Record return"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function getDefaultQuantity(maxQuantity: number) {
  if (maxQuantity <= 0) {
    return "0";
  }

  return maxQuantity < 1 ? String(maxQuantity) : "1";
}
