"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { deleteQuotationAction } from "@/features/quotations/actions/quotation-actions";
import type { QuotationStatus } from "@/features/quotations/types";
import { canDeleteQuotation } from "@/features/quotations/utils";

export function QuotationRowActions({
  quotationId,
  quotationNumber,
  status,
}: {
  quotationId: string;
  quotationNumber: string;
  status: QuotationStatus;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const canEdit = status !== "approved";
  const canRevise = status === "approved";
  const canDelete = canDeleteQuotation(status);

  return (
    <>
      <TableRowActionsMenu label={`Open row actions for ${quotationNumber}`}>
        <TableRowActionsMenuLink
          href={`/quotations/${quotationId}`}
          label="View quotation"
          iconName="eye"
        />
        {canEdit ? (
          <TableRowActionsMenuLink
            href={`/quotations/${quotationId}/edit`}
            label="Edit quotation"
            iconName="pencil"
          />
        ) : null}
        {canRevise ? (
          <TableRowActionsMenuLink
            href={`/quotations/${quotationId}/revise`}
            label="Revise quotation"
            iconName="pencil"
          />
        ) : null}
        {canDelete ? (
          <TableRowActionsMenuButton
            label="Delete quotation"
            icon={Trash2}
            tone="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          />
        ) : null}
      </TableRowActionsMenu>
      {canDelete ? (
        <ConfirmActionDialog
          title={`Delete ${quotationNumber}?`}
          description="This quotation and its line items will be removed permanently. Approved quotations must be managed through the linked job order instead."
          confirmLabel="Delete quotation"
          cancelLabel="Keep quotation"
          action={deleteQuotationAction}
          fields={[{ name: "quotationId", value: quotationId }]}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </>
  );
}
