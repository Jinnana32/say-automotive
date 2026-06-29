"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { deleteJobOrderAction } from "@/features/job-orders/actions/job-order-actions";

export function JobOrderRowActions({
  jobOrderId,
  jobOrderNumber,
  canDelete,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  canDelete: boolean;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Open row actions for ${jobOrderNumber}`}>
        <TableRowActionsMenuLink
          href={`/job-orders/${jobOrderId}`}
          label="Open job order"
          iconName="eye"
        />
        {canDelete ? (
          <TableRowActionsMenuButton
            label="Delete job order"
            icon={Trash2}
            tone="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          />
        ) : null}
      </TableRowActionsMenu>
      {canDelete ? (
        <ConfirmActionDialog
          title={`Delete ${jobOrderNumber}?`}
          description="This job order and its line items will be removed permanently. Linked approved quotations return to pending approval. Job orders with active invoices or used parts cannot be deleted."
          confirmLabel="Delete job order"
          cancelLabel="Keep job order"
          action={deleteJobOrderAction}
          fields={[{ name: "jobOrderId", value: jobOrderId }]}
          closeOnSubmit={false}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </>
  );
}
