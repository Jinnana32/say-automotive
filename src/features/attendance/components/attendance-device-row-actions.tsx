"use client";

import { useState } from "react";
import { Check, Power, RotateCcw, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionConfirm } from "@/components/shared/icon-action";
import { TableRowActionsMenu, TableRowActionsMenuButton } from "@/components/shared/table-row-actions-menu";
import {
  approveStaffDeviceAction,
  deleteStaffDeviceAction,
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      {device.status === "approved" ? (
        <div className="flex items-center justify-end gap-1">
          <IconActionConfirm
            label="Reset device access"
            icon={RotateCcw}
            title={`Reset ${displayName}?`}
            description="This will immediately block the mechanic from using this phone or browser for time-in/time-out."
            confirmLabel="Reset device access"
            cancelLabel="Cancel"
            action={revokeStaffDeviceAction}
            fields={[{ name: "deviceId", value: device.id }]}
            tone="destructive"
          />
          <TableRowActionsMenu label={`Open row actions for ${displayName}`}>
            <TableRowActionsMenuButton
              label="Delete device record"
              icon={Trash2}
              tone="destructive"
              onSelect={() => setIsDeleteOpen(true)}
            />
          </TableRowActionsMenu>
        </div>
      ) : (
        <TableRowActionsMenu label={`Open row actions for ${displayName}`}>
          <TableRowActionsMenuButton
            label="Approve device"
            icon={Check}
            onSelect={() => setIsApproveOpen(true)}
          />
          <TableRowActionsMenuButton
            label="Revoke device"
            icon={Power}
            tone="destructive"
            onSelect={() => setIsRevokeOpen(true)}
          />
          <TableRowActionsMenuButton
            label="Delete device record"
            icon={Trash2}
            tone="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          />
        </TableRowActionsMenu>
      )}

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

      {device.status !== "approved" ? (
        <ConfirmActionDialog
          title={`Revoke ${displayName}?`}
          description="This keeps the device blocked for attendance until it is approved again."
          confirmLabel="Revoke device"
          cancelLabel="Cancel"
          action={revokeStaffDeviceAction}
          fields={[{ name: "deviceId", value: device.id }]}
          open={isRevokeOpen}
          onOpenChange={setIsRevokeOpen}
        />
      ) : null}

      <ConfirmActionDialog
        title={`Delete ${displayName}?`}
        description="This permanently removes the device record from review history. The mechanic will need to register the device again on their next portal visit."
        confirmLabel="Delete device record"
        cancelLabel="Cancel"
        action={deleteStaffDeviceAction}
        fields={[{ name: "deviceId", value: device.id }]}
        confirmVariant="destructive"
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
