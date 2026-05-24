"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_INLINE_SERVICE_ACTION_STATE } from "@/features/services/inline-service-action-state";
import {
  createInlineServiceAction,
} from "@/features/services/actions/service-actions";
import type { ServiceInlineCreateResult } from "@/features/services/types";
import { formatMoneyInputValue, MONEY_INPUT_STEP } from "@/lib/currency";
import { useFormValues } from "@/lib/use-form-values";

const INITIAL_VALUES = {
  name: "",
  category: "",
  description: "",
  laborPrice: formatMoneyInputValue(0),
  estimatedDurationMinutes: "",
};

export function QuickCreateServiceDialog({
  onCreated,
  triggerLabel = "Add new service",
  triggerVariant = "outline",
  triggerSize = "sm",
}: {
  onCreated: (service: ServiceInlineCreateResult) => void;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setInstanceKey((current) => current + 1);
    }
  }, [open]);

  return (
    <QuickCreateServiceDialogForm
      key={instanceKey}
      open={open}
      onOpenChange={setOpen}
      onCreated={onCreated}
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
    />
  );
}

function QuickCreateServiceDialogForm({
  open,
  onOpenChange,
  onCreated,
  triggerLabel,
  triggerVariant,
  triggerSize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (service: ServiceInlineCreateResult) => void;
  triggerLabel: string;
  triggerVariant: ButtonProps["variant"];
  triggerSize: ButtonProps["size"];
}) {
  const [state, formAction] = useActionState(
    createInlineServiceAction,
    INITIAL_INLINE_SERVICE_ACTION_STATE,
  );
  const handledCreatedServiceId = useRef<string | null>(null);
  const { values, updateFormValue } = useFormValues(INITIAL_VALUES);

  useEffect(() => {
    if (!open) {
      handledCreatedServiceId.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (state.status !== "success" || !state.service) {
      return;
    }

    if (handledCreatedServiceId.current === state.service.id) {
      return;
    }

    handledCreatedServiceId.current = state.service.id;
    onCreated(state.service);
    onOpenChange(false);
  }, [onCreated, onOpenChange, state]);

  return (
    <ModalDialog
      title="Add new service"
      description="Create a branch-owned labor or service entry without leaving the current workflow."
      size="md"
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          onClick={openDialog}
        >
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="owningBranchId" value="" />
          <input type="hidden" name="shareGlobally" value="" />
          <input type="hidden" name="status" value="active" />

          <FormStatusMessage message={state.message} />

          <div className="space-y-2">
            <Label htmlFor="quickServiceName">Service name</Label>
            <Input
              id="quickServiceName"
              name="name"
              value={values.name}
              onChange={(event) => updateFormValue("name", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="name" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quickServiceCategory">Category</Label>
              <Input
                id="quickServiceCategory"
                name="category"
                value={values.category}
                onChange={(event) =>
                  updateFormValue("category", event.target.value)
                }
                placeholder="Maintenance, diagnostics, electrical"
              />
              <FieldError errors={state.fieldErrors} name="category" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickServicePrice">Labor price</Label>
              <Input
                id="quickServicePrice"
                name="laborPrice"
                inputMode="decimal"
                type="number"
                step={MONEY_INPUT_STEP}
                value={values.laborPrice}
                onChange={(event) =>
                  updateFormValue("laborPrice", event.target.value)
                }
              />
              <FieldError errors={state.fieldErrors} name="laborPrice" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quickServiceDuration">Estimated duration (minutes)</Label>
              <Input
                id="quickServiceDuration"
                name="estimatedDurationMinutes"
                inputMode="numeric"
                value={values.estimatedDurationMinutes}
                onChange={(event) =>
                  updateFormValue("estimatedDurationMinutes", event.target.value)
                }
              />
              <FieldError
                errors={state.fieldErrors}
                name="estimatedDurationMinutes"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickServiceDescription">Description</Label>
            <Textarea
              id="quickServiceDescription"
              name="description"
              value={values.description}
              onChange={(event) =>
                updateFormValue("description", event.target.value)
              }
              placeholder="Optional service scope or notes"
            />
            <FieldError errors={state.fieldErrors} name="description" />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Creating...">
              Create service
            </SubmitButton>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}
