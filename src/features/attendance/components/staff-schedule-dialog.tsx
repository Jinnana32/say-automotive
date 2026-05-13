"use client";

import { useState } from "react";
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
}: {
  staffId: string;
  staffName: string;
  schedule: StaffScheduleSummary | null;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Work schedule"
      description={`Configure the expected weekly schedule for ${staffName}.`}
      size="lg"
      trigger={({ openDialog }) =>
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
      }
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
