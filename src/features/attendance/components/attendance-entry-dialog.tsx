"use client";

import { useEffect, useRef, useState } from "react";
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
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  staffId: string;
  staffName: string;
  attendanceDate: string;
  attendance: AttendanceRecordSummary | null;
  disabled?: boolean;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);
  const previousOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = open ?? false;

    if (isOpen && !previousOpenRef.current) {
      setDialogInstance((currentValue) => currentValue + 1);
    }

    previousOpenRef.current = isOpen;
  }, [open]);

  const resolvedTrigger = showTrigger
    ? ({ openDialog }: { openDialog: () => void }) =>
        trigger ? (
          trigger({
            openDialog: () => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            },
          })
        ) : (
          <IconActionButton
            label={`Edit attendance for ${staffName}`}
            icon={Clock3}
            disabled={disabled}
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          />
        )
    : undefined;

  return (
    <ModalDialog
      title="Attendance entry"
      description={`Review or update ${staffName}'s record for ${formatDate(attendanceDate)}.`}
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
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
