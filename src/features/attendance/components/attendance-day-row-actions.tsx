"use client";

import { useState } from "react";
import { CheckCheck, Pencil, Undo2 } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { TableRowActionsMenu, TableRowActionsMenuButton } from "@/components/shared/table-row-actions-menu";
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
  const approvalAvailable = attendance && canApprove;
  const actionCount = Number(canEdit) + Number(Boolean(approvalAvailable));

  const editAction = canEdit ? (
    <IconActionButton
      label="Edit attendance"
      icon={Pencil}
      onClick={() => setIsEditOpen(true)}
    />
  ) : null;

  const approvalAction = approvalAvailable ? (
    <AttendanceApprovalButton
      attendanceId={attendance.id}
      isApproved={isApproved}
      disabled={!canApprove}
      trigger={({ submit }) => (
        <IconActionButton
          label={isApproved ? "Remove approval" : "Approve attendance"}
          icon={isApproved ? Undo2 : CheckCheck}
          onClick={submit}
        />
      )}
    />
  ) : null;

  return (
    <>
      {actionCount <= 1 ? (
        editAction ?? approvalAction
      ) : (
        <TableRowActionsMenu label={`Open row actions for ${staffName}`}>
          {canEdit ? (
            <TableRowActionsMenuButton
              label="Edit attendance"
              icon={Pencil}
              onSelect={() => setIsEditOpen(true)}
            />
          ) : null}
          <AttendanceApprovalButton
            attendanceId={attendance!.id}
            isApproved={isApproved}
            disabled={!canApprove}
            trigger={({ submit }) => (
              <TableRowActionsMenuButton
                label={isApproved ? "Remove approval" : "Approve attendance"}
                icon={isApproved ? Undo2 : CheckCheck}
                onSelect={submit}
              />
            )}
          />
        </TableRowActionsMenu>
      )}

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
