"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuConfirm,
} from "@/components/shared/table-row-actions-menu";
import { deleteBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import type { BranchHolidaySummary } from "@/features/attendance/types";

export function BranchHolidayRowActions({
  holiday,
}: {
  holiday: BranchHolidaySummary;
}) {
  return (
    <TableRowActionsMenu label={`Holiday actions for ${holiday.label}`}>
      <BranchHolidayDialog
        holiday={holiday}
        trigger={({ openDialog }) => (
          <TableRowActionsMenuButton
            label={`Edit ${holiday.label}`}
            icon={Pencil}
            onSelect={openDialog}
          />
        )}
      />
      <TableRowActionsMenuConfirm
        label="Delete holiday"
        title={`Delete ${holiday.label}?`}
        description="This holiday will stop excluding attendance from payroll once removed."
        confirmLabel="Delete holiday"
        cancelLabel="Keep holiday"
        action={deleteBranchHolidayAction}
        fields={[{ name: "holidayId", value: holiday.id }]}
        icon={Trash2}
      />
    </TableRowActionsMenu>
  );
}
