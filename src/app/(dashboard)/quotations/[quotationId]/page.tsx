import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import {
  DetailSummaryGrid,
  DetailSummaryItem,
} from '@/components/shared/detail-summary-grid';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { formatWorkshopLineItemType } from '@/lib/line-item-type';
import { formatDate, formatDateTime } from '@/lib/dates';
import { getJobOrderById } from '@/features/job-orders/queries/job-order-queries';
import {
  approveQuotationAction,
  rejectQuotationAction,
} from '@/features/quotations/actions/quotation-actions';
import { QuotationDeleteButton } from '@/features/quotations/components/quotation-delete-button';
import {
  QuotationStatusBadge,
  formatQuotationStatus,
} from '@/features/quotations/components/quotation-status-badge';
import { getQuotationById } from '@/features/quotations/queries/quotation-queries';
import { canDeleteQuotation, canReviseQuotation, hasQuotationCustomerNameMismatch } from '@/features/quotations/utils';

export const dynamic = 'force-dynamic';

type QuotationDetailPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { quotationId } = await params;
  const quotation = await getQuotationById(quotationId);

  if (!quotation) {
    notFound();
  }

  const canApprove =
    quotation.status === 'draft' || quotation.status === 'pending_approval';
  const canEdit = quotation.status !== 'approved';
  const jobOrder =
    quotation.status === 'approved' && quotation.jobOrderId
      ? await getJobOrderById(quotation.jobOrderId)
      : null;
  const canRevise = canReviseQuotation({
    status: quotation.status,
    jobOrderId: quotation.jobOrderId,
    jobOrderStatus: jobOrder?.status ?? null,
    hasActiveInvoice:
      Boolean(jobOrder?.invoiceId) && jobOrder?.invoiceStatus !== 'cancelled',
  });
  const canDelete = canDeleteQuotation(quotation.status) && !quotation.jobOrderId;
  const customerNameMismatch = hasQuotationCustomerNameMismatch({
    customerNameSnapshot: quotation.customerNameSnapshot,
    linkedCustomerName: quotation.linkedCustomerName,
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Service Desk' },
          { label: 'Quotations', href: '/quotations' },
          { label: quotation.quotationNumber },
        ]}
      />

      <PageHeader
        title={quotation.quotationNumber}
        titleClassName="whitespace-nowrap"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{quotation.customerName}</span>
            <span className="text-muted-foreground/70" aria-hidden="true">
              ·
            </span>
            <span>{quotation.vehicleLabel}</span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link
                href={`/quotations/${quotation.id}/print`}
                target="_blank"
                rel="noreferrer"
              >
                Print quotation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`/api/quotations/${quotation.id}/pdf`}>Download PDF</a>
            </Button>
            {canEdit ? (
              <Button asChild variant="outline">
                <Link href={`/quotations/${quotation.id}/edit`}>
                  Edit quotation
                </Link>
              </Button>
            ) : null}
            {canRevise ? (
              <Button asChild variant="outline">
                <Link href={`/quotations/${quotation.id}/revise`}>
                  Revise quotation
                </Link>
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <form action={approveQuotationAction}>
                  <input
                    type="hidden"
                    name="quotationId"
                    value={quotation.id}
                  />
                  <Button type="submit">Approve and create job order</Button>
                </form>
                <form action={rejectQuotationAction}>
                  <input
                    type="hidden"
                    name="quotationId"
                    value={quotation.id}
                  />
                  <Button type="submit" variant="ghost">
                    Reject quotation
                  </Button>
                </form>
              </>
            ) : null}
            {canDelete ? (
              <QuotationDeleteButton
                quotationId={quotation.id}
                quotationNumber={quotation.quotationNumber}
              />
            ) : null}
          </>
        }
      />

      {customerNameMismatch ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            Customer name on this quotation does not match the linked customer.
          </p>
          <p className="mt-1 text-amber-900/90">
            Quotation shows <span className="font-medium">{quotation.customerNameSnapshot}</span>,
            but the linked customer record is{' '}
            <Link
              href={`/customers/${quotation.customerId}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {quotation.linkedCustomerName}
            </Link>
            . Searching Customers uses the linked record name. Revise this quotation to refresh
            the saved name, or update the customer profile if the record itself is wrong.
          </p>
        </div>
      ) : null}

      <DetailSummaryGrid className="sm:grid-cols-2 xl:grid-cols-3">
        <DetailSummaryItem
          label="Customer"
          value={
            <Link
              href={`/customers/${quotation.customerId}`}
              className="underline-offset-4 hover:underline"
            >
              {quotation.customerName}
            </Link>
          }
          hint={
            customerNameMismatch
              ? `Linked customer: ${quotation.linkedCustomerName}`
              : quotation.customerContactNumber ?? quotation.vehicleLabel
          }
        />
        <DetailSummaryItem
          label="Vehicle"
          value={quotation.vehicleLabel}
          hint={
            quotation.vehiclePlateNumber ??
            quotation.vehicleVin ??
            'No plate or VIN recorded'
          }
        />
        <DetailSummaryItem
          label="Quotation status"
          value={formatQuotationStatus(quotation.status)}
          hint={
            quotation.approvedAt
              ? `Approved ${formatDateTime(quotation.approvedAt)}`
              : `Created ${formatDate(quotation.createdAt)}`
          }
          badge={<QuotationStatusBadge status={quotation.status} />}
        />
        <DetailSummaryItem
          label="Prepared by"
          value={quotation.preparedByName ?? 'Not captured'}
          hint={quotation.preparedByTitle ?? 'No title captured'}
        />
        <DetailSummaryItem
          label="Job order"
          value={
            quotation.jobOrderId && quotation.jobOrderNumber ? (
              <Link
                href={`/job-orders/${quotation.jobOrderId}`}
                className="underline-offset-4 hover:underline"
              >
                {quotation.jobOrderNumber}
              </Link>
            ) : (
              'Not created'
            )
          }
          hint="Created only after quotation approval."
        />
        <DetailSummaryItem
          label="Quoted items"
          value={`${quotation.items.length} line item${quotation.items.length === 1 ? '' : 's'}`}
          hint={`Subtotal ${formatCurrency(quotation.subtotal)}`}
        />
        <DetailSummaryItem
          label="Commercial adjustments"
          value={`${formatCurrency(quotation.discount)} discount`}
          hint={`${formatCurrency(quotation.tax)} tax`}
        />
        <DetailSummaryItem
          label="Total estimate"
          value={formatCurrency(quotation.totalAmount)}
          hint={quotation.natureOfRepair ?? 'No nature of repair provided'}
        />
      </DetailSummaryGrid>

      <SectionCard
        title="Quotation context"
        description="Print-facing customer, vehicle, and repair scope data captured on the quotation."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetadataItem
            label="Contact number"
            value={quotation.customerContactNumber ?? 'No contact number'}
          />
          <MetadataItem
            label="Address"
            value={quotation.customerAddress ?? 'No address'}
          />
          <MetadataItem
            label="Car model & year"
            value={
              quotation.vehicleMake && quotation.vehicleModel
                ? `${quotation.vehicleMake} ${quotation.vehicleModel}${quotation.vehicleYear ? ` (${quotation.vehicleYear})` : ''}`
                : quotation.vehicleLabel
            }
          />
          <MetadataItem
            label="Plate number"
            value={quotation.vehiclePlateNumber ?? 'No plate number'}
          />
          <MetadataItem label="VIN" value={quotation.vehicleVin ?? 'No VIN'} />
          <MetadataItem
            label="Nature of repair"
            value={quotation.natureOfRepair ?? 'Not provided'}
          />
          <MetadataItem
            label="Inspection notes"
            value={quotation.inspectionNotes ?? 'No inspection notes'}
            className="md:col-span-2 xl:col-span-3"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Estimate items"
        description="The final invoice should come from actual job-order items, not directly from this list."
        contentClassName="space-y-4"
      >
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Qty / Unit</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.lineNumber}</TableCell>
                  <TableCell>{formatWorkshopLineItemType(item.itemType)}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {formatQuantityWithUnit(item.quantity, item.unitLabel)}
                  </TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <TotalRow
            label="Subtotal"
            value={formatCurrency(quotation.subtotal)}
          />
          <TotalRow
            label="Discount"
            value={formatCurrency(quotation.discount)}
          />
          <TotalRow label="Tax" value={formatCurrency(quotation.tax)} />
          <TotalRow
            label="Total estimate"
            value={formatCurrency(quotation.totalAmount)}
            emphasized
          />
        </div>
      </SectionCard>
    </div>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/70 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MetadataItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

function formatQuantityWithUnit(quantity: number, unitLabel: string | null) {
  return unitLabel ? `${quantity} ${unitLabel}` : String(quantity);
}
