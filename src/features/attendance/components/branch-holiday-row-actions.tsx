"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton } from "@/components/shared/icon-action";
import { deleteBranchHolidayAction } from "@/features/attendance/actions/timekeeping-actions";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import type { BranchHolidaySummary } from "@/features/attendance/types";

export function BranchHolidayRowActions({
  holiday,
}: {
  holiday: BranchHolidaySummary;
}) {
  return (
    <div className="flex justify-end gap-1">
      <BranchHolidayDialog
        holiday={holiday}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Edit ${holiday.label}`}
            icon={Pencil}
            onClick={openDialog}
          />
        )}
      />
      <ConfirmActionDialog
        title={`Delete ${holiday.label}?`}
        description="This holiday will stop excluding attendance from payroll once removed."
        confirmLabel="Delete holiday"
        cancelLabel="Keep holiday"
        action={deleteBranchHolidayAction}
        fields={[{ name: "holidayId", value: holiday.id }]}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Delete ${holiday.label}`}
            icon={Trash2}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={openDialog}
          />
        )}
      />
    </div>
  );
}
