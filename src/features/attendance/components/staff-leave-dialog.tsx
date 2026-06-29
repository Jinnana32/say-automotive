"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { StaffLeaveForm } from "@/features/attendance/components/staff-leave-form";
import type {
  StaffLeaveEntrySummary,
  TimekeepingCalendarStaffOption,
} from "@/features/attendance/types";
import { buildStaffLeaveFormValues } from "@/features/attendance/utils";

export function StaffLeaveDialog({
  activeStaff,
  leaveEntry,
  triggerLabel = "Add approved leave",
  trigger,
}: {
  activeStaff: TimekeepingCalendarStaffOption[];
  leaveEntry?: StaffLeaveEntrySummary | null;
  triggerLabel?: string;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);
  const openWithFreshState = (openDialog: () => void) => {
    setDialogInstance((currentValue) => currentValue + 1);
    openDialog();
  };

  return (
    <ModalDialog
      title={leaveEntry ? "Edit approved leave" : "Add approved leave"}
      description="Approved leave removes expected attendance for the covered workdays in payroll."
      size="lg"
      trigger={({ openDialog }) =>
        trigger ? (
          trigger({ openDialog: () => openWithFreshState(openDialog) })
        ) : (
          <Button
            type="button"
            size="sm"
            variant="add"
            onClick={() => openWithFreshState(openDialog)}
          >
            <CalendarRange className="mr-2 size-4" />
            {triggerLabel}
          </Button>
        )
      }
    >
      {({ closeDialog }) => (
        <StaffLeaveForm
          key={dialogInstance}
          activeStaff={activeStaff}
          closeDialog={closeDialog}
          initialValues={buildStaffLeaveFormValues(activeStaff[0]?.id ?? "", leaveEntry ?? null)}
        />
      )}
    </ModalDialog>
  );
}
