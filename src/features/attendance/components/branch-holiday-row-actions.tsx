"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { deleteBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import type { BranchHolidaySummary } from "@/features/attendance/types";

export function BranchHolidayRowActions({
  holiday,
}: {
  holiday: BranchHolidaySummary;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Open row actions for ${holiday.label}`}>
        <TableRowActionsMenuButton
          label={`Edit ${holiday.label}`}
          icon={Pencil}
          onSelect={() => setIsEditOpen(true)}
        />
        <TableRowActionsMenuButton
          label="Delete calendar date"
          icon={Trash2}
          tone="destructive"
          onSelect={() => setIsDeleteOpen(true)}
        />
      </TableRowActionsMenu>
      <BranchHolidayDialog
        holiday={holiday}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        showTrigger={false}
      />
      <ConfirmActionDialog
        title={`Delete ${holiday.label}?`}
        description="This calendar date will stop excluding attendance from payroll readiness once removed."
        confirmLabel="Delete calendar date"
        cancelLabel="Keep calendar date"
        action={deleteBranchHolidayAction}
        fields={[{ name: "holidayId", value: holiday.id }]}
        closeOnSubmit={false}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
