import Link from 'next/link';
import {
  ArrowLeft,
  CarFront,
  ClipboardList,
  ReceiptText,
  Wrench,
} from 'lucide-react';

import {
  DetailSummaryGrid,
  DetailSummaryItem,
} from '@/components/shared/detail-summary-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { MetricGrid } from '@/components/shared/metric-grid';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  removeMechanicAction,
  setJobOrderItemApprovalAction,
} from '@/features/job-orders/actions/job-order-actions';
import { AssignMechanicForm } from '@/features/job-orders/components/assign-mechanic-form';
import { JobOrderAdditionalItemDialog } from '@/features/job-orders/components/job-order-additional-item-dialog';
import { JobOrderDetailTabs } from '@/features/job-orders/components/job-order-detail-tabs';
import { JobOrderDetailsForm } from '@/features/job-orders/components/job-order-details-form';
import { JobOrderPartsUsagePanel } from '@/features/job-orders/components/job-order-parts-usage-panel';
import {
  JobOrderApprovalBadge,
  JobOrderStatusBadge,
  JobOrderUsageBadge,
} from '@/features/job-orders/components/job-order-status-badge';
import { JobOrderStatusDialog } from '@/features/job-orders/components/job-order-status-dialog';
import type {
  JobOrderDetail,
  JobOrderDetailTab,
  JobOrderFormOptions,
  JobOrderMechanicOption,
} from '@/features/job-orders/types';
import { formatJobOrderStatus } from '@/features/job-orders/utils';
import { CreateInvoiceForm } from '@/features/invoices/components/create-invoice-form';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/dates';

export function JobOrderDetailPage({
  jobOrder,
  formOptions,
  availableMechanics,
  activeTab,
}: {
  jobOrder: JobOrderDetail;
  formOptions: JobOrderFormOptions;
  availableMechanics: JobOrderMechanicOption[];
  activeTab: JobOrderDetailTab;
}) {
  const isReleased = jobOrder.status === 'released';

  return (
    <div className="space-y-5">
      <div className="sticky top-20 z-20 rounded-2xl border border-border/70 bg-background/95 px-5 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:top-[5.25rem]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Job order
              </span>
              <JobOrderStatusBadge status={jobOrder.status} />
              {isReleased ? (
                <Badge variant="neutral">Finalized record</Badge>
              ) : null}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {jobOrder.jobOrderNumber}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/job-orders">
                <ArrowLeft className="size-4" />
                Back to job orders
              </Link>
            </Button>
            {jobOrder.quotationId ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/quotations/${jobOrder.quotationId}`}>
                  View quotation
                </Link>
              </Button>
            ) : null}
            {jobOrder.invoiceId ? (
              <Button asChild variant="bluePrimary" size="sm">
                <Link href={`/invoices/${jobOrder.invoiceId}`}>
                  Open invoice
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Customer & vehicle"
          icon={CarFront}
          value={jobOrder.customerName}
          badge={
            jobOrder.quotationNumber ? (
              <Badge variant="outline">Quoted</Badge>
            ) : undefined
          }
          lines={[
            jobOrder.vehicleLabel,
            jobOrder.quotationNumber
              ? `Source ${jobOrder.quotationNumber}`
              : 'Manual flow',
          ]}
        />
        <SummaryCard
          title="Job progress"
          icon={ClipboardList}
          value={
            <span className="capitalize">
              {formatJobOrderStatus(jobOrder.status)}
            </span>
          }
          lines={[
            `Created ${formatDateTime(jobOrder.createdAt)}`,
            jobOrder.releasedAt
              ? `Released ${formatDateTime(jobOrder.releasedAt)}`
              : jobOrder.completedAt
                ? `Completed ${formatDateTime(jobOrder.completedAt)}`
                : '',
          ]}
        >
          <div className="mt-3 flex items-center gap-2">
            <JobOrderStatusBadge status={jobOrder.status} />
            {jobOrder.availableNextStatuses.length > 0 ? (
              <JobOrderStatusDialog
                jobOrderId={jobOrder.id}
                currentStatus={jobOrder.status}
                availableNextStatuses={jobOrder.availableNextStatuses}
              />
            ) : null}
          </div>
          {jobOrder.availableNextStatuses.length === 0 ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No status changes available for this job order.
            </p>
          ) : null}
        </SummaryCard>
        <SummaryCard
          title="Invoice & payment"
          icon={ReceiptText}
          value={jobOrder.invoiceNumber ?? 'No invoice yet'}
          badge={
            jobOrder.invoiceStatus ? (
              <InvoiceStatusBadge status={jobOrder.invoiceStatus} />
            ) : (
              <Badge variant="neutral">Not billed</Badge>
            )
          }
          lines={[
            jobOrder.invoiceId
              ? `Paid ${formatCurrency(jobOrder.invoicePaidAmount ?? 0)} of ${formatCurrency(jobOrder.invoiceTotalAmount ?? 0)}`
              : 'Generate after the job is ready for billing.',
            `Balance ${formatCurrency(jobOrder.invoiceBalance ?? 0)}`,
          ]}
        />
        <SummaryCard
          title="Assigned mechanics"
          icon={Wrench}
          value={`${jobOrder.mechanics.length} assigned`}
          lines={
            jobOrder.mechanics.length > 0
              ? [
                  jobOrder.mechanics
                    .slice(0, 2)
                    .map((mechanic) => mechanic.fullName)
                    .join(', '),
                ]
              : ['No mechanics assigned yet']
          }
        />
      </div>

      <JobOrderDetailTabs
        activeTab={activeTab}
        overview={
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Customer and vehicle"
              description="Reference details for the shop team before moving into notes or actions."
            >
              <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-2">
                <DetailSummaryItem
                  label="Customer"
                  value={
                    <Link
                      href={`/customers/${jobOrder.customerId}`}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {jobOrder.customerName}
                    </Link>
                  }
                />
                <DetailSummaryItem
                  label="Vehicle"
                  value={jobOrder.vehicleLabel}
                />
                <DetailSummaryItem
                  label="Quotation source"
                  value={jobOrder.quotationNumber ?? 'Manual flow'}
                  hint={
                    jobOrder.quotationId
                      ? 'This work order came from an approved quotation.'
                      : 'Created directly without a quotation source.'
                  }
                />
                <DetailSummaryItem
                  label="Timeline"
                  value={
                    jobOrder.startedAt
                      ? formatDateTime(jobOrder.startedAt)
                      : 'Not started'
                  }
                  hint={
                    jobOrder.completedAt
                      ? `Completed ${formatDateTime(jobOrder.completedAt)}`
                      : `Created ${formatDateTime(jobOrder.createdAt)}`
                  }
                />
              </DetailSummaryGrid>
            </SectionCard>

            {jobOrder.canEditDetails ? (
              <JobOrderDetailsForm detail={jobOrder} />
            ) : (
              <ReadOnlyOperationalNotes detail={jobOrder} />
            )}
          </div>
        }
        billing={
          <SectionCard
            title="Billing snapshot"
            description="Invoice readiness is based on actual approved work items, not the original estimate."
          >
            <div className="space-y-4">
              <MetricGrid className="md:grid-cols-3 xl:grid-cols-3">
                <StatCard
                  title="Billable total"
                  value={formatCurrency(jobOrder.billableTotal)}
                />
                <StatCard
                  title="Pending extras"
                  value={String(jobOrder.pendingApprovalCount)}
                  description={
                    jobOrder.pendingApprovalCount > 0
                      ? formatCurrency(jobOrder.pendingApprovalTotal)
                      : 'No pending value'
                  }
                  tone={
                    jobOrder.pendingApprovalCount > 0 ? 'warning' : 'neutral'
                  }
                />
                <StatCard
                  title="Rejected extras"
                  value={
                    jobOrder.rejectedAdditionalTotal > 0
                      ? formatCurrency(jobOrder.rejectedAdditionalTotal)
                      : 'None'
                  }
                  description="Excluded from invoice generation"
                  tone={
                    jobOrder.rejectedAdditionalTotal > 0
                      ? 'destructive'
                      : 'neutral'
                  }
                />
              </MetricGrid>

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                {jobOrder.invoiceId ? (
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">
                          {jobOrder.invoiceNumber}
                        </p>
                        {jobOrder.invoiceStatus ? (
                          <InvoiceStatusBadge status={jobOrder.invoiceStatus} />
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Paid {formatCurrency(jobOrder.invoicePaidAmount ?? 0)}{' '}
                        of {formatCurrency(jobOrder.invoiceTotalAmount ?? 0)} ·
                        Balance {formatCurrency(jobOrder.invoiceBalance ?? 0)}
                      </p>
                    </div>
                    <Button asChild variant="bluePrimary">
                      <Link href={`/invoices/${jobOrder.invoiceId}`}>
                        Open invoice
                      </Link>
                    </Button>
                  </div>
                ) : jobOrder.canGenerateInvoice ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This job order is ready for billing and does not have an
                      invoice yet.
                    </p>
                    <CreateInvoiceForm jobOrderId={jobOrder.id} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Move the job order to{' '}
                    <span className="font-medium">ready for billing</span>{' '}
                    before generating an invoice.
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        }
        workItems={
          <div className="space-y-5">
            <SectionCard
              title="Job order items"
              description="Quoted lines and additional charges are easier to review here before billing."
              action={
                jobOrder.canAddAdditionalItems ? (
                  <JobOrderAdditionalItemDialog
                    jobOrderId={jobOrder.id}
                    options={{
                      products: formOptions.products,
                      services: formOptions.services,
                    }}
                    redirectTab={activeTab}
                  />
                ) : null
              }
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
                      <TableRow
                        key={item.id}
                        className={cn(
                          item.isAdditional &&
                            item.approvalStatus === 'pending' &&
                            'bg-warning/5',
                          item.isAdditional &&
                            item.approvalStatus === 'rejected' &&
                            'bg-destructive/5',
                        )}
                      >
                        <TableCell className="font-medium">
                          {item.lineNumber}
                          {item.isAdditional ? ' · Extra' : ''}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                            {item.isAdditional &&
                            item.approvalStatus === 'rejected' ? (
                              <p className="mt-1 text-xs text-destructive">
                                Rejected extra. Excluded from billing.
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.itemType}
                        </TableCell>
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
                          item.approvalStatus === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <form action={setJobOrderItemApprovalAction}>
                                <input
                                  type="hidden"
                                  name="jobOrderId"
                                  value={jobOrder.id}
                                />
                                <input
                                  type="hidden"
                                  name="jobOrderItemId"
                                  value={item.id}
                                />
                                <input
                                  type="hidden"
                                  name="approvalStatus"
                                  value="approved"
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                >
                                  Approve
                                </Button>
                              </form>
                              <form action={setJobOrderItemApprovalAction}>
                                <input
                                  type="hidden"
                                  name="jobOrderId"
                                  value={jobOrder.id}
                                />
                                <input
                                  type="hidden"
                                  name="jobOrderItemId"
                                  value={item.id}
                                />
                                <input
                                  type="hidden"
                                  name="approvalStatus"
                                  value="rejected"
                                />
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
                                  : 'No action'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          </div>
        }
        partsUsage={
          <JobOrderPartsUsagePanel
            jobOrderId={jobOrder.id}
            items={jobOrder.items}
            status={jobOrder.status}
          />
        }
        mechanics={
          <div className="space-y-5">
            <SectionCard
              title="Assigned mechanics"
              description="Separate assignments keep work ownership clear across the team."
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
                            {mechanic.taskDescription ??
                              'No specific task recorded'}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {mechanic.startedAt
                              ? `Started ${formatDateTime(mechanic.startedAt)}`
                              : 'No start time recorded'}
                          </p>
                        </div>
                        {jobOrder.canAssignMechanics ? (
                          <form action={removeMechanicAction}>
                            <input
                              type="hidden"
                              name="jobOrderId"
                              value={jobOrder.id}
                            />
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={mechanic.id}
                            />
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
              <AssignMechanicForm
                jobOrderId={jobOrder.id}
                mechanics={availableMechanics}
                />
              ) : null}
          </div>
        }
      />
    </div>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  value,
  lines,
  badge,
  children,
}: {
  title: string;
  icon: typeof CarFront;
  value: React.ReactNode;
  lines: string[];
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </p>
            <div className="text-base font-semibold text-foreground">
              {value}
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            {lines.filter(Boolean).map((line, index) => (
              <p
                key={`${title}-${index}`}
                className="text-sm text-muted-foreground"
              >
                {line}
              </p>
            ))}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ReadOnlyOperationalNotes({ detail }: { detail: JobOrderDetail }) {
  return (
    <SectionCard
      title="Operational notes"
      description="Completed and released records stay readable without opening an edit-heavy form."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField
            label="Mileage in"
            value={
              detail.mileageIn !== null ? String(detail.mileageIn) : 'Not set'
            }
          />
          <ReadOnlyField
            label="Mileage out"
            value={
              detail.mileageOut !== null ? String(detail.mileageOut) : 'Not set'
            }
          />
        </div>

        <div className="space-y-4">
          <NarrativeBlock
            label="Customer concern"
            value={detail.customerConcern ?? 'No concern recorded'}
          />
          <NarrativeBlock
            label="Inspection notes"
            value={detail.inspectionNotes ?? 'No inspection notes recorded'}
          />
          <NarrativeBlock
            label="Diagnosis"
            value={detail.diagnosis ?? 'No diagnosis recorded'}
          />
          <NarrativeBlock
            label="Work performed"
            value={detail.workPerformed ?? 'No work performed recorded'}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function NarrativeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
