"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton } from "@/components/shared/icon-action";
import { deleteStaffLeaveEntryAction } from "@/features/attendance/actions/timekeeping-actions";
import { StaffLeaveDialog } from "@/features/attendance/components/staff-leave-dialog";
import type {
  StaffLeaveManagementItem,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";

export function StaffLeaveRowActions({
  leaveEntry,
  activeStaff,
}: {
  leaveEntry: StaffLeaveManagementItem;
  activeStaff: TimekeepingCalendarStaffOption[];
}) {
  return (
    <div className="flex justify-end gap-1">
      <StaffLeaveDialog
        activeStaff={activeStaff}
        leaveEntry={leaveEntry}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Edit approved leave for ${leaveEntry.staffName}`}
            icon={Pencil}
            onClick={openDialog}
          />
        )}
      />
      <ConfirmActionDialog
        title={`Delete approved leave for ${leaveEntry.staffName}?`}
        description="This leave entry will stop excluding those workdays from attendance expectations."
        confirmLabel="Delete leave entry"
        cancelLabel="Keep leave entry"
        action={deleteStaffLeaveEntryAction}
        fields={[{ name: "leaveEntryId", value: leaveEntry.id }]}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Delete approved leave for ${leaveEntry.staffName}`}
            icon={Trash2}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={openDialog}
          />
        )}
      />
    </div>
  );
}
