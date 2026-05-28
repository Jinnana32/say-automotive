"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuConfirm,
} from "@/components/shared/table-row-actions-menu";
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
    <TableRowActionsMenu label={`Open row actions for ${leaveEntry.staffName}`}>
      <StaffLeaveDialog
        activeStaff={activeStaff}
        leaveEntry={leaveEntry}
        trigger={({ openDialog }) => (
          <TableRowActionsMenuButton
            label={`Edit approved leave for ${leaveEntry.staffName}`}
            icon={Pencil}
            onSelect={openDialog}
          />
        )}
      />
      <TableRowActionsMenuConfirm
        label="Delete leave entry"
        title={`Delete approved leave for ${leaveEntry.staffName}?`}
        description="This leave entry will stop excluding those workdays from attendance expectations."
        confirmLabel="Delete leave entry"
        cancelLabel="Keep leave entry"
        action={deleteStaffLeaveEntryAction}
        fields={[{ name: "leaveEntryId", value: leaveEntry.id }]}
        icon={Trash2}
      />
    </TableRowActionsMenu>
  );
}
