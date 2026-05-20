import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge, PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { getPaymentById } from "@/features/invoices/queries/invoice-queries";
import { formatInvoiceStatus, formatPaymentMethod } from "@/features/invoices/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type PaymentDetailPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { paymentId } = await params;
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Billing" },
          { label: "Payments", href: "/payments" },
          { label: payment.invoiceNumber },
        ]}
      />

      <PageHeader
        title="Payment Receipt"
        description={`${payment.customerName} • ${formatCurrency(payment.amount)} via ${formatPaymentMethod(payment.paymentMethod)}`}
        actions={
          <>
            <Button asChild variant="outlineBlue">
              <Link href={`/payments/${payment.id}/print`} target="_blank" rel="noreferrer">
                Print receipt
              </Link>
            </Button>
            <Button asChild variant="bluePrimary">
              <a href={`/api/payments/${payment.id}/pdf`}>Download PDF</a>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/invoices/${payment.invoiceId}`}>View invoice</Link>
            </Button>
            {payment.jobOrderId ? (
              <Button asChild variant="ghost">
                <Link href={`/job-orders/${payment.jobOrderId}`}>View job order</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <DetailSummaryGrid>
        <DetailSummaryItem label="Invoice" value={payment.invoiceNumber} hint={formatDate(payment.invoiceDate)} />
        <DetailSummaryItem
          label="Invoice status"
          value={formatInvoiceStatus(payment.invoiceStatus)}
          hint={`Balance after payment ${formatCurrency(payment.invoiceBalanceAfterPayment)}`}
          badge={<InvoiceStatusBadge status={payment.invoiceStatus} />}
        />
        <DetailSummaryItem label="Customer" value={payment.customerName} hint={payment.customerContactNumber ?? "No contact number"} />
        <DetailSummaryItem label="Vehicle" value={payment.vehicleLabel} hint={payment.vehiclePlateNumber ?? payment.vehicleVin ?? "No plate or VIN"} />
        <DetailSummaryItem
          label="Payment method"
          value={formatPaymentMethod(payment.paymentMethod)}
          hint={payment.referenceNumber ?? "No reference number"}
          badge={<PaymentMethodBadge method={payment.paymentMethod} />}
        />
        <DetailSummaryItem
          label="Paid at"
          value={formatDateTime(payment.paidAt)}
          hint={`Recorded ${formatDateTime(payment.createdAt)}`}
        />
        <DetailSummaryItem
          label="Amount received"
          value={formatCurrency(payment.amount)}
          hint={`Balance before ${formatCurrency(payment.invoiceBalanceBeforePayment)}`}
        />
        <DetailSummaryItem
          label="Received by"
          value={payment.receivedByName ?? "Not captured"}
          hint={payment.receivedByTitle ? formatLabel(payment.receivedByTitle) : "No title captured"}
        />
      </DetailSummaryGrid>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Receipt context"
          description="This payment is attached to the invoice and downstream release status."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <MetadataItem label="Invoice total" value={formatCurrency(payment.invoiceTotalAmount)} />
            <MetadataItem label="Paid amount on invoice" value={formatCurrency(payment.invoicePaidAmount)} />
            <MetadataItem label="Balance before payment" value={formatCurrency(payment.invoiceBalanceBeforePayment)} />
            <MetadataItem label="Balance after payment" value={formatCurrency(payment.invoiceBalanceAfterPayment)} />
            <MetadataItem label="Source" value={payment.jobOrderNumber ?? payment.saleNumber ?? "Direct sale"} />
            <MetadataItem
              label="Address"
              value={payment.customerAddress ?? "No address captured"}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Notes"
          description="Reference and remarks captured when the payment was recorded."
        >
          <div className="space-y-4">
            <MetadataItem label="Reference number" value={payment.referenceNumber ?? "No reference number"} />
            <MetadataItem label="Notes" value={payment.notes ?? "No notes recorded"} />
          </div>
        </SectionCard>
      </div>
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
