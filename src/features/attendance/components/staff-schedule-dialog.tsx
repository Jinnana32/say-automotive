"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { StaffScheduleForm } from "@/features/attendance/components/staff-schedule-form";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import { buildStaffScheduleFormValues } from "@/features/attendance/utils";

export function StaffScheduleDialog({
  staffId,
  staffName,
  schedule,
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  staffId: string;
  staffName: string;
  schedule: StaffScheduleSummary | null;
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
            label={`Edit work schedule for ${staffName}`}
            icon={CalendarClock}
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          />
        )
    : undefined;

  return (
    <ModalDialog
      title="Work schedule"
      description={`Configure the expected weekly schedule for ${staffName}.`}
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
    >
      {({ closeDialog }) => (
        <StaffScheduleForm
          key={dialogInstance}
          staffName={staffName}
          closeDialog={closeDialog}
          initialValues={buildStaffScheduleFormValues(staffId, schedule)}
        />
      )}
    </ModalDialog>
  );
}
