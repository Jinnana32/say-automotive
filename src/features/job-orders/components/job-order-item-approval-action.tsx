"use client";

import { useRef } from "react";

import {
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { setJobOrderItemApprovalAction } from "@/features/job-orders/actions/job-order-actions";
import type { JobOrderDetailTab } from "@/features/job-orders/types";

export function JobOrderItemApprovalAction({
  label,
  jobOrderId,
  jobOrderItemId,
  approvalStatus,
  redirectTab,
  tone = "default",
}: {
  label: string;
  jobOrderId: string;
  jobOrderItemId: string;
  approvalStatus: "approved" | "rejected";
  redirectTab: JobOrderDetailTab;
  tone?: "default" | "destructive";
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={setJobOrderItemApprovalAction} ref={formRef}>
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="jobOrderItemId" value={jobOrderItemId} />
      <input type="hidden" name="approvalStatus" value={approvalStatus} />
      <input type="hidden" name="redirectTab" value={redirectTab} />
      <TableRowActionsMenuButton
        label={label}
        onSelect={() => formRef.current?.requestSubmit()}
        tone={tone}
      />
    </form>
  );
}

