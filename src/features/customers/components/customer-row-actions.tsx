"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuConfirm,
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
  return (
    <TableRowActionsMenu label={`Customer actions for ${customerLabel}`}>
      <TableRowActionsMenuLink href={`/customers/${customerId}/edit`} label="Edit customer" icon={Pencil} />
      <TableRowActionsMenuConfirm
        label="Delete customer"
        title={`Delete ${customerLabel}?`}
        description="This customer will be removed permanently if there are no linked vehicles or operational records."
        confirmLabel="Delete customer"
        cancelLabel="Keep customer"
        action={deleteCustomerAction}
        fields={[{ name: "customerId", value: customerId }]}
        icon={Trash2}
      />
    </TableRowActionsMenu>
  );
}
