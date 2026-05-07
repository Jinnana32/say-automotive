"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { JobOrderStatusForm } from "@/features/job-orders/components/job-order-status-form";
import type { JobOrderStatus } from "@/features/job-orders/types";

export function JobOrderStatusDialog({
  jobOrderId,
  currentStatus,
  availableNextStatuses,
}: {
  jobOrderId: string;
  currentStatus: JobOrderStatus;
  availableNextStatuses: JobOrderStatus[];
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Update job status"
      description="Move this job order to the next valid operational step."
      size="md"
      trigger={({ openDialog }) => (
        <IconActionButton
          label="Update job status"
          icon={Pencil}
          variant="outline"
          className="size-7 rounded-full"
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        />
      )}
    >
      {({ closeDialog }) => (
        <JobOrderStatusForm
          key={dialogInstance}
          jobOrderId={jobOrderId}
          currentStatus={currentStatus}
          availableNextStatuses={availableNextStatuses}
          closeDialog={closeDialog}
        />
      )}
    </ModalDialog>
  );
}
