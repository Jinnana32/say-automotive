import Link from 'next/link';
import { CarFront, ClipboardList, ReceiptText, Wrench } from 'lucide-react';

import { ActionDropdown } from '@/components/shared/action-dropdown';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
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
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from '@/components/shared/table-row-actions-menu';
import {
  removeMechanicAction,
  setJobOrderItemApprovalAction,
} from '@/features/job-orders/actions/job-order-actions';
import { AssignMechanicForm } from '@/features/job-orders/components/assign-mechanic-form';
import { JobOrderAdditionalItemDialog } from '@/features/job-orders/components/job-order-additional-item-dialog';
import { JobOrderChecklistPanel } from '@/features/job-orders/components/job-order-checklist-panel';
import { JobOrderDetailTabs } from '@/features/job-orders/components/job-order-detail-tabs';
import { JobOrderDetailsForm } from '@/features/job-orders/components/job-order-details-form';
import { JobOrderItemApprovalAction } from '@/features/job-orders/components/job-order-item-approval-action';
import { JobOrderItemEditDialog } from '@/features/job-orders/components/job-order-item-edit-dialog';
import { JobOrderPartsUsagePanel } from '@/features/job-orders/components/job-order-parts-usage-panel';
import { JobOrderStatusBadge } from '@/features/job-orders/components/job-order-status-badge';
import { JobOrderStatusWorkflow } from '@/features/job-orders/components/job-order-status-workflow';
import type {
  JobOrderDetail,
  JobOrderDetailTab,
  JobOrderMechanicOption,
} from '@/features/job-orders/types';
import { formatJobOrderStatus } from '@/features/job-orders/utils';
import { CreateInvoiceForm } from '@/features/invoices/components/create-invoice-form';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { formatDateTime } from '@/lib/dates';

export function JobOrderDetailPage({
  jobOrder,
  availableMechanics,
  activeTab,
}: {
  jobOrder: JobOrderDetail;
  availableMechanics: JobOrderMechanicOption[];
  activeTab: JobOrderDetailTab;
}) {
  const isReleased = jobOrder.status === 'released';
  const jobProgressLines = buildJobProgressLines(jobOrder);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-background/95 px-5 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:top-[5.25rem]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <Breadcrumbs
              items={[
                { label: 'Service Desk' },
                { label: 'Job Orders', href: '/job-orders' },
                { label: jobOrder.jobOrderNumber },
              ]}
            />
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
              <p className="text-sm text-muted-foreground">
                {jobOrder.customerName} • {jobOrder.vehicleLabel}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end">
            <ActionDropdown
              label="Print job order"
              variant="outline"
              size="sm"
              items={[
                {
                  label: 'Print',
                  href: `/job-orders/${jobOrder.id}/print`,
                  target: '_blank',
                  rel: 'noreferrer',
                },
                {
                  label: 'Print without prices',
                  href: `/job-orders/${jobOrder.id}/print?hidePrices=1`,
                  target: '_blank',
                  rel: 'noreferrer',
                },
              ]}
            />
            <Button asChild variant="outline" size="sm">
              <a href={`/api/job-orders/${jobOrder.id}/pdf`}>Download PDF</a>
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
            jobOrder.quotationId && jobOrder.quotationNumber ? (
              <span key="quotation-link">
                Source{' '}
                <Link
                  href={`/quotations/${jobOrder.quotationId}`}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {jobOrder.quotationNumber}
                </Link>
              </span>
            ) : (
              'Manual flow'
            ),
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
          lines={jobProgressLines}
        >
          <JobOrderStatusWorkflow jobOrder={jobOrder} redirectTab={activeTab} />
        </SummaryCard>
        <SummaryCard
          title="Invoice & payment"
          icon={ReceiptText}
          value={
            jobOrder.invoiceId && jobOrder.invoiceNumber ? (
              <Link
                href={`/invoices/${jobOrder.invoiceId}`}
                className="underline-offset-4 hover:underline"
              >
                {jobOrder.invoiceNumber}
              </Link>
            ) : (
              'No invoice yet'
            )
          }
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
              : jobOrder.requireInvoiceBeforeJobCompletion ||
                  jobOrder.requireInvoiceBeforeVehicleRelease
                ? 'Generate before the branch-required completion or release checkpoint.'
                : 'Invoice generation is optional after the work is billable.',
            jobOrder.invoiceId
              ? `Balance ${formatCurrency(jobOrder.invoiceBalance ?? 0)}`
              : jobOrder.requireInvoiceBeforeJobCompletion ||
                  jobOrder.requireInvoiceBeforeVehicleRelease
                ? 'The Job Progress card will reflect when an invoice is required before release.'
                : 'Operational completion can continue without invoice.',
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
                  value={
                    jobOrder.quotationId && jobOrder.quotationNumber ? (
                      <Link
                        href={`/quotations/${jobOrder.quotationId}`}
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        {jobOrder.quotationNumber}
                      </Link>
                    ) : (
                      'Manual flow'
                    )
                  }
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
              <JobOrderDetailsForm detail={jobOrder} redirectTab={activeTab} />
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
                      {jobOrder.requireInvoiceBeforeJobCompletion ||
                      jobOrder.requireInvoiceBeforeVehicleRelease
                        ? 'No invoice generated yet. Generate one now to satisfy the current branch completion or release rules.'
                        : 'No invoice generated yet. This job order can still move through completion or release because invoice generation is optional for this branch.'}
                    </p>
                    <CreateInvoiceForm jobOrderId={jobOrder.id} />
                    <p className="text-xs leading-5 text-muted-foreground">
                      {jobOrder.requireInvoiceBeforeJobCompletion ||
                      jobOrder.requireInvoiceBeforeVehicleRelease
                        ? 'Once the invoice exists, continue the workflow from the status bar above.'
                        : 'You can also continue the workflow from the status bar above and come back here later if billing is still needed.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {jobOrder.requireInvoiceBeforeJobCompletion ||
                      jobOrder.requireInvoiceBeforeVehicleRelease
                        ? 'Invoice generation is required for at least one downstream workflow step on this branch.'
                        : 'Invoice generation is optional for this branch. Operational completion and release can continue without an invoice when branch rules allow it.'}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {jobOrder.status === 'pending' ||
                      jobOrder.status === 'in_progress' ||
                      jobOrder.status === 'waiting_for_parts' ||
                      jobOrder.status === 'waiting_for_customer_approval'
                        ? 'Move the job order to Completed before generating an invoice.'
                        : 'Use the Job Progress card to continue without invoice, or return here once the job reaches a billable stage.'}
                    </p>
                  </div>
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
                  <JobOrderAdditionalItemDialog jobOrderId={jobOrder.id} redirectTab={activeTab} />
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
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            {jobOrder.canEditItems ? (
                              <JobOrderItemEditDialog
                                jobOrderId={jobOrder.id}
                                item={item}
                                redirectTab={activeTab}
                              />
                            ) : null}

                            {jobOrder.canResolveAdditionalItems &&
                            item.isAdditional &&
                            item.approvalStatus === 'pending' ? (
                              <TableRowActionsMenu label={`Approval actions for ${item.description}`}>
                                <JobOrderItemApprovalAction
                                  label="Approve extra item"
                                  jobOrderId={jobOrder.id}
                                  jobOrderItemId={item.id}
                                  approvalStatus="approved"
                                  redirectTab={activeTab}
                                />
                                <JobOrderItemApprovalAction
                                  label="Reject extra item"
                                  jobOrderId={jobOrder.id}
                                  jobOrderItemId={item.id}
                                  approvalStatus="rejected"
                                  redirectTab={activeTab}
                                  tone="destructive"
                                />
                              </TableRowActionsMenu>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            <JobOrderChecklistPanel
              jobOrderId={jobOrder.id}
              items={jobOrder.items}
              canUpdateChecklist={jobOrder.canUpdateChecklist}
              redirectTab={activeTab}
            />
          </div>
        }
        partsUsage={
          <JobOrderPartsUsagePanel
            jobOrderId={jobOrder.id}
            items={jobOrder.items}
            status={jobOrder.status}
            redirectTab={activeTab}
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
                            <input
                              type="hidden"
                              name="redirectTab"
                              value={activeTab}
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
                redirectTab={activeTab}
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
  lines: React.ReactNode[];
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

function buildJobProgressLines(jobOrder: JobOrderDetail) {
  const lines = [`Created ${formatDateTime(jobOrder.createdAt)}`];

  if (jobOrder.startedAt) {
    lines.push(`Started ${formatDateTime(jobOrder.startedAt)}`);
  }

  if (jobOrder.completedAt) {
    lines.push(`Completed ${formatDateTime(jobOrder.completedAt)}`);
  }

  if (jobOrder.releasedAt) {
    lines.push(`Released ${formatDateTime(jobOrder.releasedAt)}`);
  }

  return lines;
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
