"use client";

import { useState } from "react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import type { StaffScheduleSummary } from "@/features/attendance/types";

export function AttendanceRosterRowActions({
  schedule,
  staffId,
  staffName,
}: {
  schedule: StaffScheduleSummary | null;
  staffId: string;
  staffName: string;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Roster actions for ${staffName}`}>
        <TableRowActionsMenuButton
          label="Edit schedule"
          onSelect={() => setIsEditOpen(true)}
        />
      </TableRowActionsMenu>

      <StaffScheduleDialog
        staffId={staffId}
        staffName={staffName}
        schedule={schedule}
        showTrigger={false}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
