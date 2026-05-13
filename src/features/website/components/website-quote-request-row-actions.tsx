"use client";

import { useRef } from "react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { updateWebsiteQuoteRequestStatusAction } from "@/features/website/actions/website-actions";

const STATUS_OPTIONS = [
  "new",
  "reviewed",
  "contacted",
  "quoted",
  "closed",
] as const;

export function WebsiteQuoteRequestRowActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: (typeof STATUS_OPTIONS)[number];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);

  function submitStatus(nextStatus: (typeof STATUS_OPTIONS)[number]) {
    if (statusRef.current) {
      statusRef.current.value = nextStatus;
    }

    formRef.current?.requestSubmit();
  }

  return (
    <form action={updateWebsiteQuoteRequestStatusAction} ref={formRef}>
      <input type="hidden" name="requestId" value={requestId} />
      <input ref={statusRef} type="hidden" name="status" value={currentStatus} />
      <TableRowActionsMenu label="Update website quote request status">
        {STATUS_OPTIONS.map((status) => (
          <TableRowActionsMenuButton
            key={status}
            label={formatStatusLabel(status)}
            onSelect={() => submitStatus(status)}
          />
        ))}
      </TableRowActionsMenu>
    </form>
  );
}

function formatStatusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
