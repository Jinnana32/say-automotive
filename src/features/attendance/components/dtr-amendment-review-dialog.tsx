"use client";

import { Eye } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { DtrAmendmentReviewForm } from "@/features/attendance/components/dtr-amendment-review-form";
import type { DtrAmendmentSummary } from "@/features/attendance/types";

export function DtrAmendmentReviewDialog({
  amendment,
  trigger,
}: {
  amendment: DtrAmendmentSummary;
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
}) {
  return (
    <ModalDialog
      title="Review DTR amendment"
      description="Approve, reject, or adjust the final attendance time before payroll uses this date."
      trigger={({ openDialog }) =>
        trigger ? (
          trigger({ openDialog })
        ) : (
          <IconActionButton
            type="button"
            label={`Review amendment for ${amendment.staffName}`}
            icon={Eye}
            onClick={openDialog}
          />
        )
      }
    >
      {({ closeDialog }) => (
        <DtrAmendmentReviewForm amendment={amendment} closeDialog={closeDialog} />
      )}
    </ModalDialog>
  );
}
