"use client";

import { Trash2 } from "lucide-react";

import { TableRowActionsMenu, TableRowActionsMenuConfirm } from "@/components/shared/table-row-actions-menu";
import { deleteAttendanceAllowedIpAction } from "@/features/attendance/actions/timekeeping-actions";
import type { AttendanceAllowedIpSummary } from "@/features/attendance/types";

export function AttendanceAllowedIpRowActions({
  allowedIp,
}: {
  allowedIp: AttendanceAllowedIpSummary;
}) {
  const label = allowedIp.label?.trim() || allowedIp.ipAddress;

  return (
    <TableRowActionsMenu label={`Allowed IP actions for ${label}`}>
      <TableRowActionsMenuConfirm
        label="Remove IP"
        title={`Remove ${label}?`}
        description="Mechanics will no longer be able to validate on-site attendance from this IP address."
        confirmLabel="Remove IP"
        cancelLabel="Keep IP"
        action={deleteAttendanceAllowedIpAction}
        fields={[{ name: "allowedIpId", value: allowedIp.id }]}
        icon={Trash2}
      />
    </TableRowActionsMenu>
  );
}
