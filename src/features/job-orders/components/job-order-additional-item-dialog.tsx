"use client";

import { useState } from "react";

import { AddEntryButton } from "@/components/shared/add-entry-button";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { JobOrderAdditionalItemForm } from "@/features/job-orders/components/job-order-additional-item-form";
import type { JobOrderDetailTab } from "@/features/job-orders/types";

export function JobOrderAdditionalItemDialog({
  jobOrderId,
  redirectTab,
}: {
  jobOrderId: string;
  redirectTab: JobOrderDetailTab;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Add additional item"
      description="Additional items follow the shop approval rule before they affect billing or stock usage."
      size="lg"
      trigger={({ openDialog }) => (
        <AddEntryButton
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          Add another line item
        </AddEntryButton>
      )}
    >
      {({ closeDialog }) => (
        <JobOrderAdditionalItemForm
          key={dialogInstance}
          jobOrderId={jobOrderId}
          redirectTab={redirectTab}
          closeDialog={closeDialog}
        />
      )}
    </ModalDialog>
  );
}
