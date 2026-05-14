import { ReportFooter } from '@/components/reports/report-footer';
import { ReportHeader } from '@/components/reports/report-header';
import { ReportSectionHeading } from '@/components/reports/report-section-heading';
import { ReportSignatureBlock } from '@/components/reports/report-signature-block';
import { ReportTotals } from '@/components/reports/report-totals';
import type { InvoicePrintDocument } from '@/features/invoices/types';
import {
  formatCurrency,
  formatPrintCurrency,
  formatPrintCurrencyNumber,
} from '@/lib/currency';
import { formatDocumentDate, formatDateTime } from '@/lib/dates';

export function InvoicePrintLayout({
  document,
}: {
  document: InvoicePrintDocument;
}) {
  const { invoice, businessProfile } = document;
  const sourceLabel =
    invoice.jobOrderNumber ?? invoice.saleNumber ?? 'Direct sale';
  const paidTotals = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[12mm] py-[10mm] text-[11px] leading-[1.35] text-slate-900">
      <ReportHeader
        businessName={businessProfile.businessName}
        documentTitle="Invoice"
        documentMeta={`Invoice No.: ${invoice.invoiceNumber} • Date: ${formatDocumentDate(invoice.invoiceDate)}`}
        logoSrc={businessProfile.businessLogoUrl ?? undefined}
      />

      <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: 'Invoice No.', value: invoice.invoiceNumber },
            { label: "Client's Name", value: invoice.customerName },
            {
              label: 'Contact Number',
              value: invoice.customerContactNumber || '—',
            },
            { label: 'Plate Number', value: invoice.vehiclePlateNumber || '—' },
          ]}
        />
        <MetadataColumn
          items={[
            { label: 'Date', value: formatDocumentDate(invoice.invoiceDate) },
            { label: 'Status', value: invoice.status.replaceAll('_', ' ') },
            { label: 'Address', value: invoice.customerAddress || '—' },
            { label: 'Car Model & Year', value: formatVehicleModel(invoice) },
          ]}
        />
      </section>

      <section className="report-section-keep mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: 'Source', value: sourceLabel },
            { label: 'Created', value: formatDateTime(invoice.createdAt) },
            {
              label: 'Released',
              value: invoice.releasedAt
                ? formatDateTime(invoice.releasedAt)
                : '—',
            },
          ]}
        />
        <MetadataColumn
          items={[
            { label: 'Vehicle', value: invoice.vehicleLabel },
            { label: 'VIN', value: invoice.vehicleVin || '—' },
            {
              label: 'Payment State',
              value:
                invoice.balance > 0
                  ? `Balance due ${formatPrintCurrency(invoice.balance)}`
                  : 'Balance cleared',
            },
          ]}
        />
      </section>

      <section className="mt-4">
        <ReportSectionHeading title="BILLING ITEMS" />
        <div className="overflow-hidden border border-brand-border">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-brand-navy text-white">
              <tr>
                <th className="w-12 px-2 py-1.5 text-left font-semibold">
                  Line
                </th>
                <th className="px-2 py-1.5 text-left font-semibold">
                  Description
                </th>
                <th className="w-16 px-2 py-1.5 text-left font-semibold">
                  Type
                </th>
                <th className="w-16 px-2 py-1.5 text-right font-semibold">
                  Qty
                </th>
                <th className="w-24 px-2 py-1.5 text-right font-semibold">
                  Price (₱)
                </th>
                <th className="w-24 px-2 py-1.5 text-right font-semibold">
                  Total (₱)
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item) => (
                  <tr
                    key={item.id}
                    className="report-row-avoid border-t border-slate-200"
                  >
                    <td className="px-2 py-1.5 align-top">{item.lineNumber}</td>
                    <td className="px-2 py-1.5 align-top">
                      {item.description}
                    </td>
                    <td className="px-2 py-1.5 align-top uppercase text-slate-700">
                      {item.itemType}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {formatPrintCurrencyNumber(item.unitPrice)}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {formatPrintCurrencyNumber(item.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td
                    colSpan={6}
                    className="px-2 py-3 text-center text-slate-500"
                  >
                    No invoice items recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section-keep mt-4 grid gap-8 sm:grid-cols-[1fr_250px]">
        <div className="space-y-120">
          <div>
            <ReportSectionHeading title="PAYMENTS" />
            <div className="overflow-hidden border border-brand-border">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-brand-navy text-white">
                  <tr>
                    <th className="w-24 px-2 py-1.5 text-left font-semibold">
                      Date
                    </th>
                    <th className="w-20 px-2 py-1.5 text-left font-semibold">
                      Method
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Reference
                    </th>
                    <th className="w-24 px-2 py-1.5 text-right font-semibold">
                      Amount (₱)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.length > 0 ? (
                    invoice.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="report-row-avoid border-t border-slate-200"
                      >
                        <td className="px-2 py-1.5 align-top">
                          {formatDocumentDate(payment.paidAt)}
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          {payment.paymentMethod.replaceAll('_', ' ')}
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          {payment.referenceNumber || '—'}
                        </td>
                        <td className="px-2 py-1.5 text-right align-top">
                          {formatPrintCurrencyNumber(payment.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-200">
                      <td
                        colSpan={4}
                        className="px-2 py-3 text-center text-slate-500"
                      >
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ReportSignatureBlock
            label="Prepared by:"
            className="mt-20"
            name={invoice.preparedByName || 'Not captured'}
            subtitle={invoice.preparedByTitle || 'No title captured'}
          />
        </div>

        <div className="space-y-2">
          <ReportSectionHeading title="INVOICE SUMMARY" />
          <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-3">
            <ReportTotals
              lines={[
                { label: 'Subtotal:', value: formatCurrency(invoice.subtotal) },
                { label: 'Discount:', value: formatCurrency(invoice.discount) },
                { label: 'Tax:', value: formatCurrency(invoice.tax) },
                {
                  label: 'TOTAL:',
                  value: formatCurrency(invoice.totalAmount),
                  emphasized: true,
                },
                { label: 'Paid:', value: formatCurrency(paidTotals) },
                {
                  label: 'Balance:',
                  value: formatCurrency(invoice.balance),
                  emphasized: invoice.balance > 0,
                },
              ]}
              className="justify-self-end"
            />
          </div>
        </div>
      </section>

      <ReportFooter
        businessName={businessProfile.businessName}
        vatRegistrationNo={businessProfile.businessVatRegistrationNo}
        contactNumber={businessProfile.businessContact}
        email={businessProfile.businessEmail}
        address={businessProfile.businessAddress}
      />
    </article>
  );
}

function MetadataColumn({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[110px_minmax(0,1fr)] gap-2"
        >
          <p className="font-semibold text-slate-800">{item.label}</p>
          <p className="min-w-0">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatVehicleModel(invoice: InvoicePrintDocument['invoice']) {
  if (invoice.vehicleMake && invoice.vehicleModel) {
    const yearPart = invoice.vehicleYear ? ` (${invoice.vehicleYear})` : '';
    return `${invoice.vehicleMake} ${invoice.vehicleModel}${yearPart}`;
  }

  return invoice.vehicleLabel;
}

function formatQuantity(value: number) {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
