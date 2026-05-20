"use client";

import { useActionState, useEffect, useState } from "react";

import {
  FieldError,
  FormStatusMessage,
} from "@/components/shared/form-status";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelInvoiceAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function CancelInvoiceDialog({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setInstanceKey((current) => current + 1);
    }
  }, [open]);

  return (
    <CancelInvoiceDialogForm
      key={instanceKey}
      invoiceId={invoiceId}
      invoiceNumber={invoiceNumber}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

function CancelInvoiceDialogForm({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
}: {
  invoiceId: string;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    cancelInvoiceAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [cancellationReason, setCancellationReason] = useState("");

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button type="button" variant="destructive" onClick={openDialog}>
          Cancel invoice
        </Button>
      )}
      title={`Cancel ${invoiceNumber}`}
      description="This will void the invoice without deleting it. Unpaid service invoices only."
      action={formAction}
      fields={[{ name: "invoiceId", value: invoiceId }]}
      confirmLabel="Cancel invoice"
      closeOnSubmit={false}
    >
      <FormStatusMessage message={state.message} />
      <div className="space-y-2">
        <label
          htmlFor="cancellationReason"
          className="text-sm font-semibold text-foreground"
        >
          Cancellation reason
        </label>
        <Textarea
          id="cancellationReason"
          name="cancellationReason"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
          placeholder="Explain why this invoice is being cancelled."
          rows={4}
        />
        <FieldError
          errors={state.fieldErrors}
          name="cancellationReason"
        />
      </div>
    </ConfirmActionDialog>
  );
}
