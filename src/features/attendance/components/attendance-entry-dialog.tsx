"use client";

import { useState } from "react";
import { Clock3 } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { AttendanceForm } from "@/features/attendance/components/attendance-form";
import type { AttendanceRecordSummary } from "@/features/attendance/types";
import { buildAttendanceFormValues } from "@/features/attendance/utils";
import { formatDate } from "@/lib/dates";

export function AttendanceEntryDialog({
  staffId,
  staffName,
  attendanceDate,
  attendance,
  disabled = false,
}: {
  staffId: string;
  staffName: string;
  attendanceDate: string;
  attendance: AttendanceRecordSummary | null;
  disabled?: boolean;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Attendance entry"
      description={`Review or update ${staffName}'s record for ${formatDate(attendanceDate)}.`}
      size="lg"
      trigger={({ openDialog }) => (
        <IconActionButton
          label={`Edit attendance for ${staffName}`}
          icon={Clock3}
          disabled={disabled}
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        />
      )}
    >
      {({ closeDialog }) => (
        <AttendanceForm
          key={dialogInstance}
          staffName={staffName}
          closeDialog={closeDialog}
          initialValues={buildAttendanceFormValues({
            staffId,
            attendanceDate,
            attendance,
          })}
        />
      )}
    </ModalDialog>
  );
}
