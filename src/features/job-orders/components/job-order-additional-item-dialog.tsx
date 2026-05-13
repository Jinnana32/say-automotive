"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          <Plus className="size-4" />
          Add additional item
        </Button>
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
