"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton, IconActionLink } from "@/components/shared/icon-action";
import { deleteCustomerAction } from "@/features/customers/actions/customer-actions";

export function CustomerRowActions({
  customerId,
  customerLabel,
}: {
  customerId: string;
  customerLabel: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <IconActionLink
        href={`/customers/${customerId}/edit`}
        label={`Edit ${customerLabel}`}
        icon={Pencil}
      />
      <ConfirmActionDialog
        title={`Delete ${customerLabel}?`}
        description="This customer will be removed permanently if there are no linked vehicles or operational records."
        confirmLabel="Delete customer"
        cancelLabel="Keep customer"
        action={deleteCustomerAction}
        fields={[{ name: "customerId", value: customerId }]}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Delete ${customerLabel}`}
            icon={Trash2}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={openDialog}
          />
        )}
      />
    </div>
  );
}
