import { ChevronDown, ClipboardList, History, PackageSearch, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { JobOrderPartUsageForm } from "@/features/job-orders/components/job-order-part-usage-form";
import type {
  JobOrderDetailTab,
  JobOrderItemDetail,
  JobOrderStatus,
} from "@/features/job-orders/types";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function JobOrderPartsUsagePanel({
  jobOrderId,
  items,
  status,
  redirectTab,
}: {
  jobOrderId: string;
  items: JobOrderItemDetail[];
  status: JobOrderStatus;
  redirectTab: JobOrderDetailTab;
}) {
  const productItems = items.filter((item) => item.itemType === "product");
  const isReleased = status === "released";

  return (
    <SectionCard
      title="Parts usage"
      description="Review planned vs actual stock movement without keeping all part forms open at once."
    >
      <div className="space-y-4">
        {isReleased ? (
          <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
            This job order has already been released. Stock movement history is shown first, and any
            post-release correction controls stay tucked inside each part record.
          </div>
        ) : null}

        {productItems.length === 0 ? (
          <EmptyState
            title="No product lines"
            description="Add product items to this job order before stock usage can be recorded."
            icon={<PackageSearch className="size-5" />}
          />
        ) : (
          <div className="space-y-3">
            {productItems.map((item) => {
              const tracking = item.inventoryTracking;
              const canUseInventory =
                tracking !== null &&
                tracking.hasStockRecord &&
                (!item.isAdditional ||
                  item.approvalStatus === "approved" ||
                  item.approvalStatus === "not_required");
              const maxUseQuantity =
                tracking === null || !canUseInventory
                  ? 0
                  : Math.min(tracking.remainingUsageQuantity, tracking.availableQuantity ?? 0);
              const maxReturnQuantity = tracking?.netUsedQuantity ?? 0;
              const hasWarnings =
                (item.isAdditional && !canUseInventory) || (tracking !== null && !tracking.hasStockRecord);

              return (
                <details
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,0.8fr))]">
                      <SummaryCell
                        className="col-span-2 lg:col-span-1"
                        label="Part"
                        value={item.description}
                        hint={`${formatQuantity(item.quantity)} planned · ${item.isAdditional ? "Extra line" : "Quoted line"}`}
                      >
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {tracking?.isLowStock ? <Badge variant="warning">Low stock</Badge> : null}
                          {tracking && !tracking.hasStockRecord ? (
                            <Badge variant="destructive">No stock</Badge>
                          ) : null}
                          {item.isAdditional && item.approvalStatus !== "approved" ? (
                            <Badge variant="neutral">Waiting approval</Badge>
                          ) : null}
                        </div>
                      </SummaryCell>
                      <SummaryCell label="Planned" value={formatQuantity(item.quantity)} />
                      <SummaryCell
                        label="Used"
                        value={formatQuantity(tracking?.netUsedQuantity ?? 0)}
                      />
                      <SummaryCell
                        label="Remaining"
                        value={formatQuantity(tracking?.remainingUsageQuantity ?? item.quantity)}
                      />
                      <SummaryCell
                        label="Available"
                        value={
                          tracking?.availableQuantity !== null &&
                          tracking?.availableQuantity !== undefined
                            ? formatQuantity(tracking.availableQuantity)
                            : "Not set"
                        }
                        hint={tracking?.shelfLocation ? `Shelf ${tracking.shelfLocation}` : "No shelf set"}
                      />
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      <ChevronDown className="size-4" />
                    </div>
                  </summary>

                  <div className="border-t border-border/70 bg-muted/20 p-4">
                    <div className="space-y-4">
                      {hasWarnings ? (
                        <div className="space-y-3">
                          {!canUseInventory && item.isAdditional ? (
                            <WarningMessage>
                              Additional product lines must be approved before inventory can be deducted.
                            </WarningMessage>
                          ) : null}

                          {tracking && !tracking.hasStockRecord ? (
                            <WarningMessage tone="destructive">
                              This product has no branch stock yet. Receive stock before recording usage.
                            </WarningMessage>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="grid gap-4 xl:grid-cols-2">
                        <JobOrderPartUsageForm
                          mode="use"
                          jobOrderId={jobOrderId}
                          jobOrderItemId={item.id}
                          maxQuantity={maxUseQuantity}
                          redirectTab={redirectTab}
                        />
                        <JobOrderPartUsageForm
                          mode="return"
                          jobOrderId={jobOrderId}
                          jobOrderItemId={item.id}
                          maxQuantity={maxReturnQuantity}
                          redirectTab={redirectTab}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <History className="size-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Usage history</p>
                        </div>
                        {tracking?.usageHistory.length ? (
                          <div className="space-y-2">
                            {tracking.usageHistory.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background p-3 text-sm md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant={entry.usageType === "use" ? "secondary" : "outline"}>
                                    {entry.usageType === "use" ? "Used" : "Returned"}
                                  </Badge>
                                  <span>{formatQuantity(entry.quantity)}</span>
                                  <span className="text-muted-foreground">
                                    Stock {formatQuantity(entry.previousQuantity)} →{" "}
                                    {formatQuantity(entry.newQuantity)}
                                  </span>
                                </div>
                                <div className="text-muted-foreground md:text-right">
                                  <p>{formatDateTime(entry.createdAt)}</p>
                                  <p>{entry.notes ?? "No notes"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border/80 bg-background px-4 py-6 text-sm text-muted-foreground">
                            No stock movements recorded for this part yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function SummaryCell({
  label,
  value,
  hint,
  children,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

function WarningMessage({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "warning" | "destructive";
}) {
  return (
    <div
      className={
        tone === "destructive"
          ? "rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          : "rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground"
      }
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <p>{children}</p>
      </div>
    </div>
  );
}

function formatQuantity(value: number) {
  return Number(value.toFixed(4)).toString();
}
