import { Check, ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { setJobOrderItemChecklistStateAction } from "@/features/job-orders/actions/job-order-actions";
import type {
  JobOrderDetailTab,
  JobOrderItemDetail,
} from "@/features/job-orders/types";
import {
  calculateJobOrderChecklistSummary,
  getJobOrderChecklistStatus,
  groupJobOrderChecklistItems,
} from "@/features/job-orders/utils";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function JobOrderChecklistPanel({
  jobOrderId,
  items,
  canUpdateChecklist,
  redirectTab,
}: {
  jobOrderId: string;
  items: JobOrderItemDetail[];
  canUpdateChecklist: boolean;
  redirectTab: JobOrderDetailTab;
}) {
  const summary = calculateJobOrderChecklistSummary(items);
  const groups = groupJobOrderChecklistItems(items).filter(
    (group) => group.items.length > 0,
  );

  return (
    <SectionCard
      title="Operational checklist"
      description="Track service and parts completion separately from billing and invoice totals."
    >
      <div className="space-y-5">
        {items.length === 0 ? (
          <EmptyState
            title="No checklist items yet"
            description="Job order items will appear here once services or parts are added to the work order."
            icon={<ClipboardList className="size-5" />}
          />
        ) : (
          <>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {summary.requiredCount === 0
                      ? "No actionable checklist items yet."
                      : summary.allRequiredCompleted
                        ? "Checklist complete"
                        : `${summary.completedCount} of ${summary.requiredCount} required items completed`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Completion is operational only. Billing still follows approved,
                    rejected, and pending item rules.
                  </p>
                  {summary.blockedCount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {summary.blockedCount} item
                      {summary.blockedCount === 1 ? "" : "s"} waiting on approval
                      or excluded from the checklist.
                    </p>
                  ) : null}
                </div>
                <Badge variant={summary.allRequiredCompleted ? "success" : "neutral"}>
                  {summary.allRequiredCompleted ? "Complete" : "In progress"}
                </Badge>
              </div>
            </div>

            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {group.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {group.label === "Parts / Products"
                          ? "Use this to track physical parts completion without changing stock movement rules."
                          : "Use this to track labor and service completion on the floor."}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {group.items.length} item{group.items.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        jobOrderId={jobOrderId}
                        item={item}
                        canUpdateChecklist={canUpdateChecklist}
                        redirectTab={redirectTab}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

function ChecklistRow({
  jobOrderId,
  item,
  canUpdateChecklist,
  redirectTab,
}: {
  jobOrderId: string;
  item: JobOrderItemDetail;
  canUpdateChecklist: boolean;
  redirectTab: JobOrderDetailTab;
}) {
  const status = getJobOrderChecklistStatus(item);
  const canToggle = canUpdateChecklist && status.actionable;

  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-border/70 bg-background p-4",
        item.checklistCompleted && status.actionable && "border-success/30 bg-success/5",
        item.approvalStatus === "pending" && "bg-warning/5",
        item.approvalStatus === "rejected" && "bg-destructive/5",
      )}
    >
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1.8fr)_120px_220px] md:items-start">
        <ChecklistToggle
          jobOrderId={jobOrderId}
          item={item}
          redirectTab={redirectTab}
          canToggle={canToggle}
          disabledReason={getChecklistDisabledReason({
            actionable: status.actionable,
            canUpdateChecklist,
          })}
        />

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{item.description}</p>
            <Badge variant="secondary">{formatItemTypeLabel(item.itemType)}</Badge>
            {item.isAdditional ? <Badge variant="outline">Extra item</Badge> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Line {item.lineNumber}
            {item.itemType === "product"
              ? ` • Qty ${formatQuantity(item.quantity)}`
              : item.itemType === "labor"
                ? " • Labor line"
                : " • Service line"}
          </p>
        </div>

        <SummaryValue
          label="Quantity"
          value={item.itemType === "product" ? formatQuantity(item.quantity) : "—"}
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {item.checklistCompleted && item.checklistCheckedAt ? (
              <span className="text-xs text-muted-foreground">
                {formatDateTime(item.checklistCheckedAt)}
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {buildChecklistMeta(item)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistToggle({
  jobOrderId,
  item,
  redirectTab,
  canToggle,
  disabledReason,
}: {
  jobOrderId: string;
  item: JobOrderItemDetail;
  redirectTab: JobOrderDetailTab;
  canToggle: boolean;
  disabledReason: string | null;
}) {
  const nextChecklistCompleted = item.checklistCompleted ? "false" : "true";

  return (
    <form action={setJobOrderItemChecklistStateAction} className="shrink-0">
      <input type="hidden" name="jobOrderId" value={jobOrderId} />
      <input type="hidden" name="jobOrderItemId" value={item.id} />
      <input
        type="hidden"
        name="checklistCompleted"
        value={nextChecklistCompleted}
      />
      <input type="hidden" name="redirectTab" value={redirectTab} />
      <button
        type="submit"
        disabled={!canToggle}
        aria-label={
          item.checklistCompleted
            ? `Mark ${item.description} as not completed`
            : `Mark ${item.description} as completed`
        }
        title={disabledReason ?? undefined}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors",
          canToggle && "hover:border-brand-navy/30 hover:bg-brand-soft hover:text-brand-navy",
          item.checklistCompleted &&
            "border-success/30 bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground",
        )}
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded border",
            item.checklistCompleted
              ? "border-current bg-transparent"
              : "border-current bg-transparent",
          )}
        >
          {item.checklistCompleted ? <Check className="size-3.5" /> : null}
        </span>
      </button>
    </form>
  );
}

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function getChecklistDisabledReason(params: {
  actionable: boolean;
  canUpdateChecklist: boolean;
}) {
  if (!params.actionable) {
    return "Only approved or standard work items can be checked off.";
  }

  if (!params.canUpdateChecklist) {
    return "You can view this checklist but cannot update it at the current role or job order status.";
  }

  return null;
}

function buildChecklistMeta(item: JobOrderItemDetail) {
  if (item.approvalStatus === "pending") {
    return "This item must be approved before the team can mark it complete.";
  }

  if (item.approvalStatus === "rejected") {
    return "Rejected items stay outside the checklist and do not move into billing.";
  }

  if (item.checklistCompleted) {
    if (item.checklistCheckedByName && item.checklistCheckedAt) {
      return `Checked by ${item.checklistCheckedByName} on ${formatDateTime(item.checklistCheckedAt)}.`;
    }

    if (item.checklistCheckedByName) {
      return `Checked by ${item.checklistCheckedByName}.`;
    }

    if (item.checklistCheckedAt) {
      return `Checked on ${formatDateTime(item.checklistCheckedAt)}.`;
    }

    return "Marked complete.";
  }

  return "Still open for operational completion.";
}

function formatItemTypeLabel(itemType: JobOrderItemDetail["itemType"]) {
  switch (itemType) {
    case "product":
      return "Part";
    case "service":
      return "Service";
    case "labor":
      return "Labor";
  }
}

function formatQuantity(value: number) {
  return Number(value.toFixed(4)).toString();
}
