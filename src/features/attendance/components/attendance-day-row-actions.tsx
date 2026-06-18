"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { AttendanceEntryDialog } from "@/features/attendance/components/attendance-entry-dialog";
import type { AttendanceRecordSummary } from "@/features/attendance/types";

export function AttendanceDayRowActions({
  attendance,
  attendanceDate,
  canEdit,
  staffId,
  staffName,
}: {
  attendance: AttendanceRecordSummary | null;
  attendanceDate: string;
  canEdit: boolean;
  staffId: string;
  staffName: string;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      {canEdit ? (
        <IconActionButton
          label="Edit attendance"
          icon={Pencil}
          onClick={() => setIsEditOpen(true)}
        />
      ) : null}

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
