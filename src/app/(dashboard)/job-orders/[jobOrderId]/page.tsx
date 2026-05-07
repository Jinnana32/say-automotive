import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  removeMechanicAction,
  setJobOrderItemApprovalAction,
} from "@/features/job-orders/actions/job-order-actions";
import { AssignMechanicForm } from "@/features/job-orders/components/assign-mechanic-form";
import { JobOrderAdditionalItemForm } from "@/features/job-orders/components/job-order-additional-item-form";
import { JobOrderDetailsForm } from "@/features/job-orders/components/job-order-details-form";
import { JobOrderPartUsageForm } from "@/features/job-orders/components/job-order-part-usage-form";
import { CreateInvoiceForm } from "@/features/invoices/components/create-invoice-form";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import {
  JobOrderApprovalBadge,
  JobOrderStatusBadge,
  JobOrderUsageBadge,
} from "@/features/job-orders/components/job-order-status-badge";
import { JobOrderStatusForm } from "@/features/job-orders/components/job-order-status-form";
import { getJobOrderById, getJobOrderFormOptions } from "@/features/job-orders/queries/job-order-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type JobOrderDetailPageProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
};

export default async function JobOrderDetailPage({ params }: JobOrderDetailPageProps) {
  const { jobOrderId } = await params;
  const [jobOrder, formOptions] = await Promise.all([
    getJobOrderById(jobOrderId),
    getJobOrderFormOptions(),
  ]);

  if (!jobOrder) {
    notFound();
  }

  const assignedMechanicIds = new Set(jobOrder.mechanics.map((mechanic) => mechanic.staffId));
  const availableMechanics = formOptions.mechanics.filter(
    (mechanic) => !assignedMechanicIds.has(mechanic.id),
  );
  const productItems = jobOrder.items.filter((item) => item.itemType === "product");

  return (
    <div className="space-y-6">
      <PageHeader
        title={jobOrder.jobOrderNumber}
        description="Operational record for actual work, stock usage, billing handoff, and release."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/job-orders">Back to job orders</Link>
            </Button>
            {jobOrder.quotationId ? (
              <Button asChild variant="ghost">
                <Link href={`/quotations/${jobOrder.quotationId}`}>View quotation</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="space-y-6">
        <DetailSummaryGrid>
          <DetailSummaryItem
            label="Customer"
            value={jobOrder.customerName}
            hint={jobOrder.vehicleLabel}
          />
          <DetailSummaryItem
            label="Quotation source"
            value={jobOrder.quotationNumber ?? "Manual flow"}
            hint="Originating estimate for this operational record."
          />
          <DetailSummaryItem
            label="Job order status"
            value={toTitleCase(jobOrder.status.replaceAll("_", " "))}
            hint={jobOrder.startedAt ? `Started ${formatDateTime(jobOrder.startedAt)}` : `Created ${formatDateTime(jobOrder.createdAt)}`}
            badge={<JobOrderStatusBadge status={jobOrder.status} />}
          />
          <DetailSummaryItem
            label="Completion"
            value={jobOrder.completedAt ? formatDateTime(jobOrder.completedAt) : "Not completed"}
            hint={jobOrder.releasedAt ? `Released ${formatDateTime(jobOrder.releasedAt)}` : "Not released"}
          />
          <DetailSummaryItem
            label="Invoice linkage"
            value={jobOrder.invoiceNumber ?? "No invoice yet"}
            hint={
              jobOrder.invoiceId
                ? `Balance ${formatCurrency(jobOrder.invoiceBalance ?? 0)}`
                : "Generate after actual work is ready for billing."
            }
            badge={jobOrder.invoiceStatus ? <InvoiceStatusBadge status={jobOrder.invoiceStatus} /> : undefined}
          />
          <DetailSummaryItem
            label="Assigned mechanics"
            value={`${jobOrder.mechanics.length} assigned`}
            hint={`${jobOrder.items.length} work item${jobOrder.items.length === 1 ? "" : "s"} on this job order`}
          />
        </DetailSummaryGrid>

        <SectionCard
          title="Billing snapshot"
          description="Totals based on actual approved work items."
        >
          <div className="space-y-4">
            <MetricGrid className="md:grid-cols-3 xl:grid-cols-3">
              <StatCard title="Billable total" value={formatCurrency(jobOrder.billableTotal)} />
              <StatCard
                title="Pending extras"
                value={String(jobOrder.pendingApprovalCount)}
                description={
                  jobOrder.pendingApprovalCount > 0
                    ? formatCurrency(jobOrder.pendingApprovalTotal)
                    : "No pending value"
                }
                tone={jobOrder.pendingApprovalCount > 0 ? "warning" : "neutral"}
              />
              <StatCard
                title="Rejected extras"
                value={
                  jobOrder.rejectedAdditionalTotal > 0
                    ? formatCurrency(jobOrder.rejectedAdditionalTotal)
                    : "None"
                }
                description="Excluded from invoice generation"
                tone={jobOrder.rejectedAdditionalTotal > 0 ? "destructive" : "neutral"}
              />
            </MetricGrid>

            <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
              {jobOrder.invoiceId ? (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{jobOrder.invoiceNumber}</p>
                      {jobOrder.invoiceStatus ? (
                        <InvoiceStatusBadge status={jobOrder.invoiceStatus} />
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Paid {formatCurrency(jobOrder.invoicePaidAmount ?? 0)} of{" "}
                      {formatCurrency(jobOrder.invoiceTotalAmount ?? 0)} · Balance{" "}
                      {formatCurrency(jobOrder.invoiceBalance ?? 0)}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/invoices/${jobOrder.invoiceId}`}>Open invoice</Link>
                  </Button>
                </div>
              ) : jobOrder.canGenerateInvoice ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This job order is ready for billing and does not have an invoice yet.
                  </p>
                  <CreateInvoiceForm jobOrderId={jobOrder.id} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Move the job order to <span className="font-medium">ready for billing</span> before generating an invoice.
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {jobOrder.canEditDetails ? (
            <JobOrderDetailsForm detail={jobOrder} />
          ) : (
            <SectionCard
              title="Operational notes"
              description="This job order is locked for note updates."
            >
              <DetailSummaryGrid>
                <DetailSummaryItem
                  label="Mileage in"
                  value={jobOrder.mileageIn !== null ? String(jobOrder.mileageIn) : "Not set"}
                />
                <DetailSummaryItem
                  label="Mileage out"
                  value={jobOrder.mileageOut !== null ? String(jobOrder.mileageOut) : "Not set"}
                />
                <DetailSummaryItem
                  label="Customer concern"
                  value={jobOrder.customerConcern ?? "No concern recorded"}
                />
                <DetailSummaryItem
                  label="Inspection notes"
                  value={jobOrder.inspectionNotes ?? "No notes"}
                />
                <DetailSummaryItem
                  label="Diagnosis"
                  value={jobOrder.diagnosis ?? "No diagnosis recorded"}
                />
                <DetailSummaryItem
                  label="Work performed"
                  value={jobOrder.workPerformed ?? "No work performed recorded"}
                />
              </DetailSummaryGrid>
            </SectionCard>
          )}

          <SectionCard
            title="Job order items"
            description="Quoted lines plus actual additional charges."
            contentClassName="p-0"
          >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.lineNumber}
                          {item.isAdditional ? " · Extra" : ""}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.itemType}</TableCell>
                        <TableCell>
                          <JobOrderApprovalBadge status={item.approvalStatus} />
                        </TableCell>
                        <TableCell>
                          <JobOrderUsageBadge status={item.usageStatus} />
                        </TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-right">
                          {jobOrder.canResolveAdditionalItems &&
                          item.isAdditional &&
                          item.approvalStatus === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <form action={setJobOrderItemApprovalAction}>
                                <input type="hidden" name="jobOrderId" value={jobOrder.id} />
                                <input type="hidden" name="jobOrderItemId" value={item.id} />
                                <input type="hidden" name="approvalStatus" value="approved" />
                                <Button type="submit" size="sm" variant="outline">
                                  Approve
                                </Button>
                              </form>
                              <form action={setJobOrderItemApprovalAction}>
                                <input type="hidden" name="jobOrderId" value={jobOrder.id} />
                                <input type="hidden" name="jobOrderItemId" value={item.id} />
                                <input type="hidden" name="approvalStatus" value="rejected" />
                                <Button type="submit" size="sm" variant="ghost">
                                  Reject
                                </Button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {item.approvedAt
                                ? `Approved ${formatDate(item.approvedAt)}`
                                : item.rejectedAt
                                  ? `Rejected ${formatDate(item.rejectedAt)}`
                                  : "No action"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          </SectionCard>

          <SectionCard
            title="Part usage tracking"
            description="Inventory moves only on actual use or return."
          >
            <div className="space-y-4">
              {productItems.length === 0 ? (
                <EmptyState
                  title="No product lines"
                  description="Add product items to this job order before stock usage can be recorded."
                />
              ) : (
                productItems.map((item) => {
                  const tracking = item.inventoryTracking;
                  const canUseInventory =
                    tracking !== null &&
                    tracking.hasStockRecord &&
                    (!item.isAdditional || item.approvalStatus === "approved");
                  const maxUseQuantity =
                    tracking === null || !canUseInventory
                      ? 0
                      : Math.min(
                          tracking.remainingUsageQuantity,
                          tracking.availableQuantity ?? 0,
                        );
                  const maxReturnQuantity = tracking?.netUsedQuantity ?? 0;

                  return (
                    <div
                      key={item.id}
                      className="space-y-4 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.description}</p>
                            {tracking?.isLowStock ? <Badge variant="warning">Low stock</Badge> : null}
                            {tracking && !tracking.hasStockRecord ? (
                              <Badge variant="destructive">No stock</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Planned quantity {formatQuantity(item.quantity)} · Used{" "}
                            {formatQuantity(tracking?.netUsedQuantity ?? 0)} · Remaining{" "}
                            {formatQuantity(tracking?.remainingUsageQuantity ?? item.quantity)}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground md:text-right">
                          <span>
                            On hand: {tracking?.quantityOnHand !== null && tracking?.quantityOnHand !== undefined
                              ? formatQuantity(tracking.quantityOnHand)
                              : "Not set"}
                          </span>
                          <span>
                            Available: {tracking?.availableQuantity !== null && tracking?.availableQuantity !== undefined
                              ? formatQuantity(tracking.availableQuantity)
                              : "Not set"}
                          </span>
                          <span>
                            Reorder: {tracking?.reorderLevel !== null && tracking?.reorderLevel !== undefined
                              ? formatQuantity(tracking.reorderLevel)
                              : "Not set"}
                          </span>
                          <span>Shelf: {tracking?.shelfLocation ?? "Not set"}</span>
                        </div>
                      </div>

                      {!canUseInventory && item.isAdditional ? (
                        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
                          Additional product lines must be approved before inventory can be deducted.
                        </div>
                      ) : null}

                      {tracking && !tracking.hasStockRecord ? (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          This product has no branch stock available yet. Receive stock before recording usage.
                        </div>
                      ) : null}

                      <div className="grid gap-4 xl:grid-cols-2">
                        <JobOrderPartUsageForm
                          mode="use"
                          jobOrderId={jobOrder.id}
                          jobOrderItemId={item.id}
                          maxQuantity={maxUseQuantity}
                        />
                        <JobOrderPartUsageForm
                          mode="return"
                          jobOrderId={jobOrder.id}
                          jobOrderItemId={item.id}
                          maxQuantity={maxReturnQuantity}
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium">Usage history</p>
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
                                    Stock {formatQuantity(entry.previousQuantity)} → {formatQuantity(entry.newQuantity)}
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
                          <p className="text-sm text-muted-foreground">
                            No stock movements recorded for this item yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <JobOrderStatusForm
            jobOrderId={jobOrder.id}
            currentStatus={jobOrder.status}
            availableNextStatuses={jobOrder.availableNextStatuses}
          />

          <SectionCard
            title="Assigned mechanics"
            description="Separate assignments let multiple mechanics work on one job order."
          >
            <div className="space-y-4">
              {jobOrder.mechanics.length === 0 ? (
                <EmptyState
                  title="No mechanics assigned"
                  description="Assign one or more mechanics to start ownership of the work."
                />
              ) : (
                <div className="space-y-3">
                  {jobOrder.mechanics.map((mechanic) => (
                    <div
                      key={mechanic.id}
                      className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{mechanic.fullName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {mechanic.taskDescription ?? "No specific task recorded"}
                        </p>
                      </div>
                      {jobOrder.canAssignMechanics ? (
                        <form action={removeMechanicAction}>
                          <input type="hidden" name="jobOrderId" value={jobOrder.id} />
                          <input type="hidden" name="assignmentId" value={mechanic.id} />
                          <Button type="submit" size="sm" variant="ghost">
                            Remove
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {jobOrder.canAssignMechanics ? (
            <AssignMechanicForm jobOrderId={jobOrder.id} mechanics={availableMechanics} />
          ) : null}

          {jobOrder.canAddAdditionalItems ? (
            <JobOrderAdditionalItemForm
              jobOrderId={jobOrder.id}
              options={{ products: formOptions.products, services: formOptions.services }}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatQuantity(value: number) {
  return Number(value.toFixed(4)).toString();
}
