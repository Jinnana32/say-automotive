"use client";

import { useState } from "react";
import { CalendarPlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { BranchHolidayForm } from "@/features/attendance/components/branch-holiday-form";
import type { BranchHolidaySummary } from "@/features/attendance/types";
import { buildBranchHolidayFormValues } from "@/features/attendance/utils";

export function BranchHolidayDialog({
  holiday,
  triggerLabel = "Add holiday",
  trigger,
}: {
  holiday?: BranchHolidaySummary | null;
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
      title={holiday ? "Edit branch holiday" : "Add branch holiday"}
      description="Branch holidays remove expected attendance for that day across payroll coverage."
      size="lg"
      trigger={({ openDialog }) =>
        trigger ? (
          trigger({ openDialog: () => openWithFreshState(openDialog) })
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => openWithFreshState(openDialog)}
          >
            <CalendarPlus2 className="mr-2 size-4" />
            {triggerLabel}
          </Button>
        )
      }
    >
      {({ closeDialog }) => (
        <BranchHolidayForm
          key={dialogInstance}
          closeDialog={closeDialog}
          initialValues={buildBranchHolidayFormValues(holiday ?? null)}
        />
      )}
    </ModalDialog>
  );
}
