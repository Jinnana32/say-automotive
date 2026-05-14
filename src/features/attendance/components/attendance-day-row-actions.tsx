"use client";

import { useState } from "react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";
import { AttendanceApprovalButton } from "@/features/attendance/components/attendance-approval-button";
import { AttendanceEntryDialog } from "@/features/attendance/components/attendance-entry-dialog";
import type { AttendanceRecordSummary } from "@/features/attendance/types";

export function AttendanceDayRowActions({
  attendance,
  attendanceDate,
  canApprove,
  canEdit,
  isApproved,
  staffId,
  staffName,
}: {
  attendance: AttendanceRecordSummary | null;
  attendanceDate: string;
  canApprove: boolean;
  canEdit: boolean;
  isApproved: boolean;
  staffId: string;
  staffName: string;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Attendance actions for ${staffName}`}>
        {attendance ? (
          <AttendanceApprovalButton
            attendanceId={attendance.id}
            isApproved={isApproved}
            disabled={!canApprove}
            trigger={({ submit }) => (
              <TableRowActionsMenuButton
                label={isApproved ? "Remove approval" : "Approve attendance"}
                disabled={!canApprove}
                onSelect={submit}
              />
            )}
          />
        ) : null}
        <TableRowActionsMenuButton
          label="Edit attendance"
          disabled={!canEdit}
          onSelect={() => setIsEditOpen(true)}
        />
      </TableRowActionsMenu>

      <AttendanceEntryDialog
        staffId={staffId}
        staffName={staffName}
        attendanceDate={attendanceDate}
        attendance={attendance}
        disabled={!canEdit}
        showTrigger={false}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
