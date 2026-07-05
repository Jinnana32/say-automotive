import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import {
  DetailSummaryGrid,
  DetailSummaryItem,
} from '@/components/shared/detail-summary-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTableScroll } from '@/components/shared/data-table-scroll';
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
import {
  InvoiceStatusBadge,
  PaymentMethodBadge,
} from '@/features/invoices/components/invoice-status-badge';
import { CancelInvoiceDialog } from '@/features/invoices/components/cancel-invoice-dialog';
import { RecordPaymentForm } from '@/features/invoices/components/record-payment-form';
import { ReleaseVehicleForm } from '@/features/invoices/components/release-vehicle-form';
import { getInvoiceById } from '@/features/invoices/queries/invoice-queries';
import { formatCurrency } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/dates';
import { requireAuthenticatedStaff } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const viewer = await requireAuthenticatedStaff();
  const invoice = await getInvoiceById(invoiceId);
  const printHref = `/invoices/${invoiceId}/print`;
  const downloadHref = `/api/invoices/${invoiceId}/pdf`;

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Billing' },
          { label: 'Invoices', href: '/invoices' },
          { label: invoice.invoiceNumber },
        ]}
      />

      <PageHeader
        title={invoice.invoiceNumber}
        description="Billing record used for collection, balance control, and vehicle release enforcement."
        actions={
          <>
            <Button asChild variant="outlineBlue">
              <Link href={printHref} target="_blank" rel="noreferrer">
                Print invoice
              </Link>
            </Button>
            <Button asChild variant="bluePrimary">
              <a href={downloadHref}>Download PDF</a>
            </Button>
            {invoice.jobOrderId ? (
              <Button asChild variant="ghost">
                <Link href={`/job-orders/${invoice.jobOrderId}`}>
                  View job order
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <DetailSummaryGrid className="grid-cols-2">
        <DetailSummaryItem label="Customer" value={invoice.customerName} />
        <DetailSummaryItem label="Vehicle" value={invoice.vehicleLabel} />
        <DetailSummaryItem
          label="Source"
          value={
            invoice.jobOrderId && invoice.jobOrderNumber ? (
              <Link
                href={`/job-orders/${invoice.jobOrderId}`}
                className="underline-offset-4 hover:underline"
              >
                {invoice.jobOrderNumber}
              </Link>
            ) : (
              (invoice.saleNumber ?? 'Direct sale')
            )
          }
        />
        <DetailSummaryItem
          label="Invoice status"
          value={invoice.status.replaceAll('_', ' ')}
          hint={
            invoice.cancelledAt
              ? `Cancelled ${formatDateTime(invoice.cancelledAt)}`
              : invoice.releasedAt
              ? `Vehicle released ${formatDateTime(invoice.releasedAt)}`
              : 'Billing and release rules are enforced from the final balance.'
          }
          badge={<InvoiceStatusBadge status={invoice.status} />}
        />
        <DetailSummaryItem
          label="Invoice date"
          value={formatDate(invoice.invoiceDate)}
          hint={`Created ${formatDateTime(invoice.createdAt)}`}
        />
        <DetailSummaryItem
          label="Source total"
          value={formatCurrency(invoice.totalAmount)}
          hint={`${formatCurrency(invoice.discount)} discount • ${formatCurrency(invoice.tax)} tax`}
        />
        <DetailSummaryItem
          label="Paid amount"
          value={formatCurrency(invoice.paidAmount)}
          hint={
            invoice.payments.length > 0
              ? `${invoice.payments.length} payment record${invoice.payments.length === 1 ? '' : 's'}`
              : 'No payments recorded yet'
          }
        />
        <DetailSummaryItem
          label="Remaining balance"
          value={formatCurrency(invoice.balance)}
          hint={
            invoice.status === 'cancelled'
              ? 'Cancelled invoices are removed from active receivables.'
              : invoice.balance > 0
              ? 'Vehicle release stays blocked until balance rules are satisfied.'
              : 'Balance cleared.'
          }
        />
      </DetailSummaryGrid>

      {invoice.status === 'cancelled' ? (
        <SectionCard
          title="Cancellation record"
          description="This invoice was voided without deleting the billing document."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <MetadataItem
              label="Cancelled at"
              value={
                invoice.cancelledAt
                  ? formatDateTime(invoice.cancelledAt)
                  : 'Not recorded'
              }
            />
            <MetadataItem
              label="Reason"
              value={invoice.cancellationReason ?? 'No reason recorded'}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard
            title="Invoice items"
            description="Snapshot of billable job-order items at invoice creation."
            contentClassName="p-0"
          >
            <DataTableScroll>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.lineNumber}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="capitalize">
                        {item.itemType}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </DataTableScroll>
          </SectionCard>

          <SectionCard
            title="Payments"
            description="Every payment updates the remaining balance atomically."
          >
            <div className="space-y-4">
              {invoice.payments.length === 0 ? (
                <EmptyState
                  title="No payments recorded"
                  description="Record the first payment to start the collection trail."
                />
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/payments/${payment.id}`}
                            className="font-semibold underline-offset-4 hover:underline"
                          >
                            {formatCurrency(payment.amount)}
                          </Link>
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.referenceNumber ?? 'No reference number'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.notes ?? 'No notes'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(payment.paidAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {(viewer.role === 'owner' || viewer.role === 'admin') &&
          invoice.canCancel ? (
            <SectionCard
              title="Cancel invoice"
              description="Use this only for unpaid service invoices that need to be voided without deleting the record."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  Cancellation is blocked once payments exist, the vehicle has been released, or the invoice came from a POS sale.
                </div>
                <CancelInvoiceDialog
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                />
              </div>
            </SectionCard>
          ) : null}

          {invoice.canRecordPayment ? (
            <SectionCard
              title="Record payment"
              description="The branch payment rules decide whether partial payments are accepted."
            >
              <RecordPaymentForm
                invoiceId={invoice.id}
                jobOrderId={invoice.jobOrderId}
                balance={invoice.balance}
                allowPartialPayments={invoice.allowPartialPayments}
              />
            </SectionCard>
          ) : null}

          {invoice.canReleaseVehicle && invoice.jobOrderId ? (
            <SectionCard
              title="Release vehicle"
              description="Release is still checked server-side against branch settings and invoice balance."
            >
              <ReleaseVehicleForm
                jobOrderId={invoice.jobOrderId}
                balance={invoice.balance}
                allowReleaseWithBalance={invoice.allowReleaseWithBalance}
                requireFullPaymentBeforeRelease={
                  invoice.requireFullPaymentBeforeRelease
                }
              />
            </SectionCard>
          ) : null}
        </div>
      </section>
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
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}
