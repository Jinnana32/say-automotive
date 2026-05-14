"use client";

import { useState } from "react";
import { Check, Power, RotateCcw } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import {
  approveStaffDeviceAction,
  revokeStaffDeviceAction,
} from "@/features/attendance/actions/attendance-device-actions";
import type { AttendanceStaffDeviceManagementItem } from "@/features/attendance/types";

export function AttendanceDeviceRowActions({
  device,
}: {
  device: AttendanceStaffDeviceManagementItem;
}) {
  const displayName = device.deviceName?.trim() || device.userAgent?.trim() || "this device";
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Device actions for ${displayName}`}>
        {device.status !== "approved" ? (
          <TableRowActionsMenuButton
            label="Approve device"
            icon={Check}
            onSelect={() => setIsApproveOpen(true)}
          />
        ) : null}

        <TableRowActionsMenuButton
          label={device.status === "approved" ? "Reset device access" : "Revoke device"}
          icon={device.status === "approved" ? RotateCcw : Power}
          tone="destructive"
          onSelect={() => setIsRevokeOpen(true)}
        />
      </TableRowActionsMenu>

      {device.status !== "approved" ? (
        <ConfirmActionDialog
          title={`Approve ${displayName}?`}
          description="Approving this device will automatically revoke any other approved attendance device for this mechanic."
          confirmLabel="Approve device"
          cancelLabel="Cancel"
          action={approveStaffDeviceAction}
          fields={[{ name: "deviceId", value: device.id }]}
          confirmVariant="default"
          open={isApproveOpen}
          onOpenChange={setIsApproveOpen}
        />
      ) : null}

      <ConfirmActionDialog
        title={`${device.status === "approved" ? "Reset" : "Revoke"} ${displayName}?`}
        description={
          device.status === "approved"
            ? "This will immediately block the mechanic from using this phone or browser for time-in/time-out."
            : "This keeps the device blocked for attendance until it is approved again."
        }
        confirmLabel={device.status === "approved" ? "Reset device access" : "Revoke device"}
        cancelLabel="Cancel"
        action={revokeStaffDeviceAction}
        fields={[{ name: "deviceId", value: device.id }]}
        open={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
      />
    </>
  );
}
