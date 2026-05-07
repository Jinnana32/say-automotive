"use client";

import { useState } from "react";
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
}: {
  staffId: string;
  staffName: string;
  profile: CompensationProfileSummary | null;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Compensation profile"
      description={`Configure how ${staffName} should be treated in payroll.`}
      size="lg"
      trigger={({ openDialog }) => (
        <IconActionButton
          label={`Edit compensation for ${staffName}`}
          icon={HandCoins}
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        />
      )}
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
