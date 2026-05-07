import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatusBadge, PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { RecordPaymentForm } from "@/features/invoices/components/record-payment-form";
import { ReleaseVehicleForm } from "@/features/invoices/components/release-vehicle-form";
import { getInvoiceById } from "@/features/invoices/queries/invoice-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description="Billing record used for collection, balance control, and vehicle release enforcement."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/invoices">Back to invoices</Link>
            </Button>
            {invoice.jobOrderId ? (
              <Button asChild variant="ghost">
                <Link href={`/job-orders/${invoice.jobOrderId}`}>View job order</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Invoice summary"
          description="Header data and collection state."
        >
          <div className="grid gap-4 text-sm">
            <DetailRow label="Customer" value={invoice.customerName} />
            <DetailRow label="Vehicle" value={invoice.vehicleLabel} />
            <DetailRow
              label="Source"
              value={invoice.jobOrderNumber ?? invoice.saleNumber ?? "Direct sale"}
            />
            <DetailRow
              label="Status"
              value={invoice.status.replaceAll("_", " ")}
              badge={<InvoiceStatusBadge status={invoice.status} />}
            />
            <DetailRow label="Invoice date" value={formatDate(invoice.invoiceDate)} />
            <DetailRow label="Created" value={formatDateTime(invoice.createdAt)} />
          </div>
        </SectionCard>

        <SectionCard
          title="Totals"
          description="Payment and release rules are enforced from the final balance."
        >
          <MetricGrid className="md:grid-cols-3 xl:grid-cols-3">
            <StatCard title="Total" value={formatCurrency(invoice.totalAmount)} />
            <StatCard title="Paid" value={formatCurrency(invoice.paidAmount)} tone="success" />
            <StatCard
              title="Balance"
              value={formatCurrency(invoice.balance)}
              tone={invoice.balance > 0 ? "warning" : "success"}
            />
          </MetricGrid>
        </SectionCard>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard
            title="Invoice items"
            description="Snapshot of billable job-order items at invoice creation."
            contentClassName="p-0"
          >
              <div className="overflow-x-auto">
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
                        <TableCell className="capitalize">{item.itemType}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.referenceNumber ?? "No reference number"}
                        </p>
                        <p className="text-sm text-muted-foreground">{payment.notes ?? "No notes"}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDateTime(payment.paidAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
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
                  requireFullPaymentBeforeRelease={invoice.requireFullPaymentBeforeRelease}
                />
            </SectionCard>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-xl border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <p>{value}</p>
        {badge}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
