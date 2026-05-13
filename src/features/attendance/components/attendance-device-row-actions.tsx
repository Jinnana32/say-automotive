"use client";

import { Check, Power, RotateCcw } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton } from "@/components/shared/icon-action";
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

  return (
    <div className="flex justify-end gap-1">
      {device.status !== "approved" ? (
        <ConfirmActionDialog
          title={`Approve ${displayName}?`}
          description="Approving this device will automatically revoke any other approved attendance device for this mechanic."
          confirmLabel="Approve device"
          cancelLabel="Cancel"
          action={approveStaffDeviceAction}
          fields={[{ name: "deviceId", value: device.id }]}
          confirmVariant="default"
          trigger={({ openDialog }) => (
            <IconActionButton
              type="button"
              label={`Approve ${displayName}`}
              icon={Check}
              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={openDialog}
            />
          )}
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
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`${device.status === "approved" ? "Reset" : "Revoke"} ${displayName}`}
            icon={device.status === "approved" ? RotateCcw : Power}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={openDialog}
          />
        )}
      />
    </div>
  );
}
