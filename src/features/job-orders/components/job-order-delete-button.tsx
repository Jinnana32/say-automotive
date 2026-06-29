"use client";

import { useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { deleteJobOrderAction } from "@/features/job-orders/actions/job-order-actions";

export function JobOrderDeleteButton({
  jobOrderId,
  jobOrderNumber,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
        Delete job order
      </Button>
      <ConfirmActionDialog
        title={`Delete ${jobOrderNumber}?`}
        description="This job order and its line items will be removed permanently. Linked approved quotations return to pending approval."
        confirmLabel="Delete job order"
        cancelLabel="Keep job order"
        action={deleteJobOrderAction}
        fields={[{ name: "jobOrderId", value: jobOrderId }]}
        closeOnSubmit={false}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
