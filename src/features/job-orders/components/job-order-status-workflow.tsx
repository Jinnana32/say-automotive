"use client";

import { useActionState, useState } from "react";

import {
  FieldError,
  FormStatusMessage,
} from "@/components/shared/form-status";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import type {
  JobOrderDetail,
  JobOrderDetailTab,
  JobOrderStatus,
} from "@/features/job-orders/types";
import {
  getJobOrderStatusDescription,
  getSimplifiedJobOrderStatus,
} from "@/features/job-orders/utils";
import { releaseJobOrderVehicleAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function JobOrderStatusWorkflow({
  jobOrder,
  redirectTab,
}: {
  jobOrder: JobOrderDetail;
  redirectTab: JobOrderDetailTab;
}) {
  const simplifiedStatus = getSimplifiedJobOrderStatus(jobOrder.status);
  const [primaryState, primaryAction] = useActionState(
    updateJobOrderStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const primaryActionConfig = getPrimaryActionConfig(
    simplifiedStatus,
    jobOrder.canUpdateStatus,
  );
  const noActionMessage = getNoActionMessage({
    simplifiedStatus,
    canUpdateStatus: jobOrder.canUpdateStatus,
    canReleaseVehicle: jobOrder.canReleaseVehicle,
  });

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <JobOrderStatusBadge status={jobOrder.status} />
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        {getJobOrderStatusDescription(jobOrder.status)}
      </p>

      {primaryActionConfig ? (
        <>
          <FormStatusMessage message={primaryState.message} />
          <form
            action={primaryAction}
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
          >
            <input type="hidden" name="jobOrderId" value={jobOrder.id} />
            <input type="hidden" name="redirectTab" value={redirectTab} />
            <input
              type="hidden"
              name="nextStatus"
              value={primaryActionConfig.nextStatus}
            />
            <input type="hidden" name="cancellationReason" value="" />

            <SubmitButton
              variant="navyPrimary"
              className="w-full sm:w-auto"
              pendingLabel={primaryActionConfig.pendingLabel}
            >
              {primaryActionConfig.label}
            </SubmitButton>

            {simplifiedStatus === "in_progress" ? (
              <CancelJobOrderDialog
                jobOrderId={jobOrder.id}
                jobOrderNumber={jobOrder.jobOrderNumber}
                redirectTab={redirectTab}
              />
            ) : null}
          </form>
        </>
      ) : null}

      {!primaryActionConfig &&
      simplifiedStatus === "completed" &&
      jobOrder.canReleaseVehicle ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <ReleaseJobOrderVehicleDialog
            jobOrderId={jobOrder.id}
            jobOrderNumber={jobOrder.jobOrderNumber}
          />
        </div>
      ) : null}

      {noActionMessage ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {noActionMessage}
        </p>
      ) : null}
    </div>
  );
}

function CancelJobOrderDialog({
  jobOrderId,
  jobOrderNumber,
  redirectTab,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  redirectTab: JobOrderDetailTab;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <CancelJobOrderDialogForm
      key={instanceKey}
      jobOrderId={jobOrderId}
      jobOrderNumber={jobOrderNumber}
      redirectTab={redirectTab}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setInstanceKey((current) => current + 1);
        }
      }}
    />
  );
}

function CancelJobOrderDialogForm({
  jobOrderId,
  jobOrderNumber,
  redirectTab,
  open,
  onOpenChange,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  redirectTab: JobOrderDetailTab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    updateJobOrderStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [cancellationReason, setCancellationReason] = useState("");

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={openDialog}
        >
          Cancel Job
        </Button>
      )}
      title={`Cancel ${jobOrderNumber}?`}
      description="This will end the job order without releasing the vehicle."
      action={formAction}
      fields={[
        { name: "jobOrderId", value: jobOrderId },
        { name: "nextStatus", value: "cancelled" },
        { name: "redirectTab", value: redirectTab },
      ]}
      confirmLabel="Cancel Job"
      cancelLabel="Keep Job"
      closeOnSubmit={false}
    >
      <FormStatusMessage message={state.message} />
      <div className="space-y-2">
        <label
          htmlFor={`job-order-cancel-reason-${jobOrderId}`}
          className="text-sm font-semibold text-foreground"
        >
          Reason (optional)
        </label>
        <Textarea
          id={`job-order-cancel-reason-${jobOrderId}`}
          name="cancellationReason"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
          placeholder="Add a short cancellation note for the audit trail."
          rows={4}
        />
        <FieldError
          errors={state.fieldErrors}
          name="cancellationReason"
        />
      </div>
    </ConfirmActionDialog>
  );
}

function ReleaseJobOrderVehicleDialog({
  jobOrderId,
  jobOrderNumber,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <ReleaseJobOrderVehicleDialogForm
      key={instanceKey}
      jobOrderId={jobOrderId}
      jobOrderNumber={jobOrderNumber}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setInstanceKey((current) => current + 1);
        }
      }}
    />
  );
}

function ReleaseJobOrderVehicleDialogForm({
  jobOrderId,
  jobOrderNumber,
  open,
  onOpenChange,
}: {
  jobOrderId: string;
  jobOrderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    releaseJobOrderVehicleAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant="navyPrimary"
          className="w-full sm:w-auto"
          onClick={openDialog}
        >
          Release Vehicle
        </Button>
      )}
      title={`Release ${jobOrderNumber}?`}
      description="This will mark the vehicle as released to the customer."
      action={formAction}
      fields={[{ name: "jobOrderId", value: jobOrderId }]}
      confirmLabel="Release Vehicle"
      confirmVariant="navyPrimary"
      closeOnSubmit={false}
    >
      <FormStatusMessage message={state.message} />
    </ConfirmActionDialog>
  );
}

function getPrimaryActionConfig(
  simplifiedStatus: ReturnType<typeof getSimplifiedJobOrderStatus>,
  canUpdateStatus: boolean,
):
  | {
      label: string;
      nextStatus: JobOrderStatus;
      pendingLabel: string;
    }
  | null {
  if (!canUpdateStatus) {
    return null;
  }

  if (simplifiedStatus === "pending") {
    return {
      label: "Start Job",
      nextStatus: "in_progress",
      pendingLabel: "Starting...",
    };
  }

  if (simplifiedStatus === "in_progress") {
    return {
      label: "Mark Completed",
      nextStatus: "completed",
      pendingLabel: "Completing...",
    };
  }

  return null;
}

function getNoActionMessage({
  simplifiedStatus,
  canUpdateStatus,
  canReleaseVehicle,
}: {
  simplifiedStatus: ReturnType<typeof getSimplifiedJobOrderStatus>;
  canUpdateStatus: boolean;
  canReleaseVehicle: boolean;
}) {
  if (simplifiedStatus === "released") {
    return "Vehicle released.";
  }

  if (simplifiedStatus === "cancelled") {
    return "Job cancelled.";
  }

  if (simplifiedStatus === "completed" && !canReleaseVehicle) {
    return "Release Vehicle becomes available when billing rules and access permissions allow it.";
  }

  if ((simplifiedStatus === "pending" || simplifiedStatus === "in_progress") && !canUpdateStatus) {
    return "Status updates are not available from your current access.";
  }

  return null;
}
