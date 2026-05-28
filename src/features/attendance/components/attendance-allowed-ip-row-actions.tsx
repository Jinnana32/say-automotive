"use client";

import { Trash2 } from "lucide-react";

import { IconActionConfirm } from "@/components/shared/icon-action";
import { deleteAttendanceAllowedIpAction } from "@/features/attendance/actions/timekeeping-actions";
import type { AttendanceAllowedIpSummary } from "@/features/attendance/types";

export function AttendanceAllowedIpRowActions({
  allowedIp,
}: {
  allowedIp: AttendanceAllowedIpSummary;
}) {
  const label = allowedIp.label?.trim() || allowedIp.ipAddress;

  return (
    <IconActionConfirm
      label={`Remove ${label}`}
      icon={Trash2}
      title={`Remove ${label}?`}
      description="Mechanics will no longer be able to validate on-site attendance from this IP address."
      confirmLabel="Remove IP"
      cancelLabel="Keep IP"
      action={deleteAttendanceAllowedIpAction}
      fields={[{ name: "allowedIpId", value: allowedIp.id }]}
      tone="destructive"
    />
  );
}
