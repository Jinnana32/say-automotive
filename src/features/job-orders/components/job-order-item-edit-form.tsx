"use client";

import { useActionState, useMemo } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateJobOrderItemAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab, JobOrderItemDetail } from "@/features/job-orders/types";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";

export function JobOrderItemEditForm({
  jobOrderId,
  item,
  redirectTab,
  closeDialog,
}: {
  jobOrderId: string;
  item: JobOrderItemDetail;
  redirectTab: JobOrderDetailTab;
  closeDialog: () => void;
}) {
  const [state, formAction] = useActionState(updateJobOrderItemAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: formatMoneyInputValue(item.unitPrice),
  });

  const isLaborItem = item.itemType === "labor";

  const isFormValid = useMemo(() => {
    if (isLaborItem && !values.description.trim()) {
      return false;
    }

    const parsedQuantity = Number(values.quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return false;
    }

    const parsedUnitPrice = Number(values.unitPrice);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      return false;
    }

    return true;
  }, [isLaborItem, values.description, values.quantity, values.unitPrice]);

  const hasUsageHistory = item.inventoryTracking?.netUsedQuantity ? item.inventoryTracking.netUsedQuantity > 0 : false;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="jobOrderItemId" value={item.id} />
      <input type="hidden" name="redirectTab" value={redirectTab} />

      <FormStatusMessage message={state.message} />
      <FormRequiredFieldsNote />

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Line {item.lineNumber} · {item.isAdditional ? "Additional" : "Quoted"} item
          </p>
          <p>
            Update the line description, quantity, or price. If this is an additional item, changes may
            return it to pending approval.
          </p>
          {hasUsageHistory ? (
            <p className="text-xs text-muted-foreground">
              Already used: {item.inventoryTracking?.netUsedQuantity?.toFixed(4) ?? "0.0000"}.
              Quantity cannot be reduced below that amount.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" optional={!isLaborItem} required={isLaborItem}>
          Description
        </Label>
        <Input
          id="description"
          name="description"
          value={values.description}
          onChange={(event) => updateFormValue("description", event.target.value)}
          placeholder={
            isLaborItem
              ? "Describe the manual labor charge"
              : "Optional override for the line item description"
          }
          className={fieldControlClassName(state.fieldErrors, "description")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "description",
            required: isLaborItem,
            errorId: fieldErrorId("description"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="description" id={fieldErrorId("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity" required>
            Quantity
          </Label>
          <Input
            id="quantity"
            name="quantity"
            inputMode="decimal"
            value={values.quantity}
            onChange={(event) => updateFormValue("quantity", event.target.value)}
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
          <Label htmlFor="unitPrice" required>
            Unit price
          </Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            inputMode="decimal"
            type="number"
            step={MONEY_INPUT_STEP}
            value={values.unitPrice}
            onChange={(event) => updateFormValue("unitPrice", event.target.value)}
            placeholder="0.00"
            className={fieldControlClassName(state.fieldErrors, "unitPrice")}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "unitPrice",
              required: true,
              errorId: fieldErrorId("unitPrice"),
            })}
          />
          <FieldError errors={state.fieldErrors} name="unitPrice" id={fieldErrorId("unitPrice")} />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <SubmitButton pendingLabel="Saving..." disabled={!isFormValid}>
          Save changes
        </SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={closeDialog}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
