"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { JobOrderItemEditForm } from "@/features/job-orders/components/job-order-item-edit-form";
import type { JobOrderDetailTab, JobOrderItemDetail } from "@/features/job-orders/types";

export function JobOrderItemEditDialog({
  jobOrderId,
  item,
  redirectTab,
  trigger,
}: {
  jobOrderId: string;
  item: JobOrderItemDetail;
  redirectTab: JobOrderDetailTab;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Edit work item"
      description="Update the quoted line before billing. Additional items may return to pending approval after changes."
      size="lg"
      trigger={({ openDialog }) =>
        trigger ? (
          trigger({
            openDialog: () => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            },
          })
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          >
            <PencilLine className="size-4" />
            Edit
          </Button>
        )
      }
    >
      {({ closeDialog }) => (
        <JobOrderItemEditForm
          key={dialogInstance}
          jobOrderId={jobOrderId}
          item={item}
          redirectTab={redirectTab}
          closeDialog={closeDialog}
        />
      )}
    </ModalDialog>
  );
}
