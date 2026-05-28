"use client";

import { useEffect, useRef, useState } from "react";
import { HandCoins } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { CompensationProfileForm } from "@/features/payroll/components/compensation-profile-form";
import type { CompensationProfileSummary } from "@/features/payroll/types";
import { buildCompensationProfileFormValues } from "@/features/payroll/utils";

export function CompensationProfileDialog({
  staffId,
  staffName,
  profile,
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  staffId: string;
  staffName: string;
  profile: CompensationProfileSummary | null;
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
            label={`Edit compensation for ${staffName}`}
            icon={HandCoins}
            onClick={() => {
              setDialogInstance((currentValue) => currentValue + 1);
              openDialog();
            }}
          />
        )
    : undefined;

  return (
    <ModalDialog
      title="Compensation profile"
      description={`Configure how ${staffName} should be treated in payroll.`}
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
    >
      {({ closeDialog }) => (
        <CompensationProfileForm
          key={dialogInstance}
          staffName={staffName}
          closeDialog={closeDialog}
          initialValues={buildCompensationProfileFormValues(staffId, profile)}
        />
      )}
    </ModalDialog>
  );
}
