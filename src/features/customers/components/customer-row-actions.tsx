"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { deleteCustomerAction } from "@/features/customers/actions/customer-actions";

export function CustomerRowActions({
  customerId,
  customerLabel,
}: {
  customerId: string;
  customerLabel: string;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Customer actions for ${customerLabel}`}>
        <TableRowActionsMenuLink href={`/customers/${customerId}/edit`} label="Edit customer" icon={Pencil} />
        <TableRowActionsMenuButton
          label="Delete customer"
          icon={Trash2}
          tone="destructive"
          onSelect={() => setIsDeleteOpen(true)}
        />
      </TableRowActionsMenu>
      <ConfirmActionDialog
        title={`Delete ${customerLabel}?`}
        description="This customer will be removed permanently if there are no linked vehicles or operational records."
        confirmLabel="Delete customer"
        cancelLabel="Keep customer"
        action={deleteCustomerAction}
        fields={[{ name: "customerId", value: customerId }]}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
