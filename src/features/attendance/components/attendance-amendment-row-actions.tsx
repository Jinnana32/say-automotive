"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton } from "@/components/shared/icon-action";
import { TableRowActionsMenu, TableRowActionsMenuButton } from "@/components/shared/table-row-actions-menu";
import { deleteDtrAmendmentAction } from "@/features/attendance/actions/dtr-amendment-actions";
import { DtrAmendmentReviewDialog } from "@/features/attendance/components/dtr-amendment-review-dialog";
import type { DtrAmendmentSummary } from "@/features/attendance/types";

export function AttendanceAmendmentRowActions({
  amendment,
}: {
  amendment: DtrAmendmentSummary;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {amendment.status === "pending" ? (
          <DtrAmendmentReviewDialog
            amendment={amendment}
            trigger={({ openDialog }) => (
              <IconActionButton
                type="button"
                label={`Review amendment for ${amendment.staffName}`}
                icon={Eye}
                onClick={openDialog}
              />
            )}
          />
        ) : null}

        <IconActionButton
          type="button"
          label={`Delete amendment for ${amendment.staffName}`}
          icon={Trash2}
          tone="destructive"
          onClick={() => setIsDeleteOpen(true)}
        />
      </div>

      <ConfirmActionDialog
        title={`Delete amendment for ${amendment.staffName}?`}
        description={
          amendment.status === "pending"
            ? "This removes the pending amendment request before it is reviewed."
            : "This removes the amendment request from review history. It does not change attendance that was already approved."
        }
        confirmLabel="Delete amendment"
        cancelLabel="Cancel"
        action={deleteDtrAmendmentAction}
        fields={[{ name: "amendmentId", value: amendment.id }]}
        confirmVariant="destructive"
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
