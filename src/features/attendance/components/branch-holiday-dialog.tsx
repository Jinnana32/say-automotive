"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { BranchHolidayForm } from "@/features/attendance/components/branch-holiday-form";
import type { BranchHolidaySummary } from "@/features/attendance/types";
import { buildBranchHolidayFormValues } from "@/features/attendance/utils";

export function BranchHolidayDialog({
  holiday,
  triggerLabel = "Add calendar date",
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  holiday?: BranchHolidaySummary | null;
  triggerLabel?: string;
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
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          >
            <CalendarPlus2 className="mr-2 size-4" />
            {triggerLabel}
          </Button>
        )
    : undefined;

  return (
    <ModalDialog
      title={holiday ? "Edit branch calendar date" : "Add branch calendar date"}
      description="Branch calendar dates remove expected attendance for that day and store the payroll treatment for future payroll runs."
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
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
