"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRight, ChevronRight, CircleAlert, PencilLine } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { updateJobOrderStatusAction } from "@/features/job-orders/actions/job-order-actions";
import type {
  JobOrderDetail,
  JobOrderDetailTab,
  JobOrderStatus,
} from "@/features/job-orders/types";
import {
  calculateJobOrderChecklistSummary,
  formatJobOrderStatus,
  getJobOrderStatusDescription,
  JOB_ORDER_STATUS_WORKFLOW,
} from "@/features/job-orders/utils";
import { releaseJobOrderVehicleAction } from "@/features/invoices/actions/invoice-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function JobOrderStatusWorkflow({
  jobOrder,
  redirectTab,
}: {
  jobOrder: JobOrderDetail;
  redirectTab: JobOrderDetailTab;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<JobOrderStatus | null>(null);
  const hasStatusActions =
    jobOrder.availableNextStatuses.length > 0 || jobOrder.canReleaseVehicle;
  const workflowStatuses = useMemo<JobOrderStatus[]>(
    () => {
      if (JOB_ORDER_STATUS_WORKFLOW.includes(jobOrder.status)) {
        return JOB_ORDER_STATUS_WORKFLOW;
      }

      if (jobOrder.status === "ready_for_billing") {
        return [
          ...JOB_ORDER_STATUS_WORKFLOW.slice(0, 4),
          "ready_for_billing",
          ...JOB_ORDER_STATUS_WORKFLOW.slice(4),
        ];
      }

      if (jobOrder.status === "paid") {
        return [
          ...JOB_ORDER_STATUS_WORKFLOW.slice(0, 5),
          "paid",
          ...JOB_ORDER_STATUS_WORKFLOW.slice(5),
        ];
      }

      return JOB_ORDER_STATUS_WORKFLOW;
    },
    [jobOrder.status],
  );
  const availableStatusSummary = useMemo(
    () =>
      workflowStatuses
        .filter(
          (status) =>
            status !== jobOrder.status &&
            (jobOrder.availableNextStatuses.includes(status) ||
              (status === "released" && jobOrder.canReleaseVehicle)),
        )
        .map((status) => formatJobOrderStatus(status)),
    [jobOrder.availableNextStatuses, jobOrder.canReleaseVehicle, jobOrder.status, workflowStatuses],
  );

  return (
    <ModalDialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);

        if (!open) {
          setSelectedTargetStatus(null);
        }
      }}
      title="Update job order status"
      description="Choose the next operational stage, then confirm the change."
      size="lg"
      trigger={({ openDialog }) => (
        <div
          id="job-order-status-workflow"
          className="rounded-2xl border border-border/70 bg-background/95 px-5 py-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Status workflow
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <JobOrderStatusBadge status={jobOrder.status} />
                <span className="text-sm font-medium text-foreground">
                  {formatJobOrderStatus(jobOrder.status)}
                </span>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {getJobOrderStatusDescription(jobOrder.status)}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasStatusActions
                  ? `Available now: ${availableStatusSummary.join(", ")}.`
                  : "No status changes are currently available."}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 self-start rounded-full px-4"
              disabled={!hasStatusActions}
              onClick={() => {
                setSelectedTargetStatus(null);
                openDialog();
              }}
            >
              <PencilLine className="size-4" />
              Change status
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    >
      {({ closeDialog }) => (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current status
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <JobOrderStatusBadge status={jobOrder.status} />
              <span className="text-sm font-medium text-foreground">
                {formatJobOrderStatus(jobOrder.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {getJobOrderStatusDescription(jobOrder.status)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Available choices
              </p>
              <p className="text-sm text-muted-foreground">
                Waiting statuses can move back to In Progress. From In Progress, you can continue to
                Completed or release the vehicle if branch rules allow it.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {workflowStatuses.map((status) => {
                const isCurrent = status === jobOrder.status;
                const canTransition = jobOrder.availableNextStatuses.includes(status);
                const canRelease = status === "released" && jobOrder.canReleaseVehicle;
                const isInteractive = canTransition || canRelease;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      if (!isInteractive) {
                        return;
                      }

                      setSelectedTargetStatus(status);
                    }}
                    disabled={!isInteractive}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "min-w-[8.5rem] rounded-full border px-4 py-2.5 text-left transition-colors",
                      isCurrent
                        ? "border-[#0B1F4D] bg-[#0B1F4D] text-white shadow-sm"
                        : isInteractive
                          ? "border-border/70 bg-white text-foreground hover:border-[#0B1F4D]/30 hover:bg-[#F4F7FF]"
                          : "border-border/60 bg-muted/20 text-muted-foreground opacity-70",
                    )}
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]">
                      {isCurrent ? "Current" : isInteractive ? "Available" : "Locked"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">
                      {formatJobOrderStatus(status)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTargetStatus ? (
            <JobOrderStatusConfirmationForm
              key={selectedTargetStatus}
              jobOrder={jobOrder}
              targetStatus={selectedTargetStatus}
              redirectTab={redirectTab}
              closeDialog={closeDialog}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
              Select an available status above to review the transition before confirming it.
            </div>
          )}
        </div>
      )}
    </ModalDialog>
  );
}

function JobOrderStatusConfirmationForm({
  jobOrder,
  targetStatus,
  redirectTab,
  closeDialog,
}: {
  jobOrder: JobOrderDetail;
  targetStatus: JobOrderStatus;
  redirectTab: JobOrderDetailTab;
  closeDialog: () => void;
}) {
  const action =
    targetStatus === "released"
      ? releaseJobOrderVehicleAction
      : updateJobOrderStatusAction;
  const [state, formAction] = useActionState(action, INITIAL_FORM_ACTION_STATE);
  const warnings = buildStatusWarnings(jobOrder, targetStatus);
  const guidance = buildStatusGuidance(jobOrder, targetStatus);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="jobOrderId" value={jobOrder.id} />
      {targetStatus !== "released" ? (
        <>
          <input type="hidden" name="nextStatus" value={targetStatus} />
          <input type="hidden" name="redirectTab" value={redirectTab} />
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current
          </p>
          <div className="mt-2">
            <JobOrderStatusBadge status={jobOrder.status} />
          </div>
        </div>
        <div className="flex items-center justify-center text-muted-foreground">
          <ArrowRight className="size-4" />
        </div>
        <div className="rounded-2xl border border-border/70 bg-[#F4F7FF] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Target
          </p>
          <div className="mt-2">
            <JobOrderStatusBadge status={targetStatus} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {getJobOrderStatusDescription(targetStatus)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{guidance}</p>
      </div>

      <FormStatusMessage message={state.message} />
      <FieldError errors={state.fieldErrors} name="nextStatus" />

      {warnings.length > 0 ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-4 text-warning" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Review before continuing
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton pendingLabel={targetStatus === "released" ? "Releasing..." : "Updating..."}>
          {targetStatus === "released"
            ? "Confirm release"
            : `Move to ${formatJobOrderStatus(targetStatus)}`}
        </SubmitButton>
      </div>
    </form>
  );
}

function buildStatusWarnings(jobOrder: JobOrderDetail, targetStatus: JobOrderStatus) {
  const warnings: string[] = [];
  const checklistSummary = calculateJobOrderChecklistSummary(jobOrder.items);
  const hasActiveInvoice =
    jobOrder.invoiceId !== null &&
    jobOrder.invoiceStatus !== null &&
    jobOrder.invoiceStatus !== "cancelled";
  const hasOutstandingPartUsage = jobOrder.items.some(
    (item) =>
      item.itemType === "product" &&
      (item.approvalStatus === "approved" || item.approvalStatus === "not_required") &&
      (item.inventoryTracking?.remainingUsageQuantity ?? 0) > 0,
  );

  if (
    ["completed", "released"].includes(targetStatus) &&
    jobOrder.pendingApprovalCount > 0
  ) {
    warnings.push(
      "Pending additional items still need approval or rejection before the job order can fully move forward.",
    );
  }

  if (
    ["completed", "released"].includes(targetStatus) &&
    checklistSummary.requiredCount > 0 &&
    !checklistSummary.allRequiredCompleted
  ) {
    warnings.push(
      "Some required checklist items are still open. Confirm the work is truly finished before moving on.",
    );
  }

  if (["completed", "released"].includes(targetStatus) && hasOutstandingPartUsage) {
    warnings.push(
      "Some approved parts still have planned usage remaining. Record remaining parts usage if those items were consumed.",
    );
  }

  if (
    targetStatus === "completed" &&
    jobOrder.requireInvoiceBeforeJobCompletion &&
    !hasActiveInvoice
  ) {
    warnings.push(
      "This branch requires an invoice before a job order can be marked completed.",
    );
  }

  if (targetStatus === "released") {
    if (jobOrder.requireInvoiceBeforeVehicleRelease && !hasActiveInvoice) {
      warnings.push(
        "This branch requires an invoice before the vehicle can be released.",
      );
    }

    if (
      hasActiveInvoice &&
      jobOrder.invoiceStatus !== "paid" &&
      (jobOrder.requireFullPaymentBeforeRelease || !jobOrder.allowReleaseWithBalance)
    ) {
      warnings.push(
        "This invoice still has a balance, and the current branch rules require payment to be settled before release.",
      );
    }
  }

  return warnings;
}

function buildStatusGuidance(jobOrder: JobOrderDetail, targetStatus: JobOrderStatus) {
  if (targetStatus === "completed") {
    return jobOrder.requireInvoiceBeforeJobCompletion
      ? "Completion is allowed once the branch invoice requirement has been satisfied."
      : "Completion marks the work as finished even if no invoice has been generated yet.";
  }

  if (targetStatus === "released") {
    return jobOrder.requireInvoiceBeforeVehicleRelease
      ? "Release still follows the current branch invoice and payment rules."
      : "This branch allows operational release without forcing invoice generation first.";
  }

  return `Move the job order into ${formatJobOrderStatus(targetStatus)} when the work matches that stage.`;
}
