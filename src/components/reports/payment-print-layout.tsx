import { ReportFooter } from "@/components/reports/report-footer";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import { ReportTotals } from "@/components/reports/report-totals";
import type { PaymentPrintDocument } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";
import { formatDocumentDate, formatDateTime } from "@/lib/dates";

export function PaymentPrintLayout({
  document,
}: {
  document: PaymentPrintDocument;
}) {
  const { payment, businessProfile } = document;
  const sourceLabel = payment.jobOrderNumber ?? payment.saleNumber ?? "Direct sale";

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[12mm] py-[10mm] text-[11px] leading-[1.35] text-slate-900">
      <ReportHeader
        businessName={businessProfile.businessName}
        documentTitle="Payment Receipt"
        documentMeta={`Invoice No.: ${payment.invoiceNumber} • Paid At: ${formatDocumentDate(payment.paidAt)}`}
        logoSrc={businessProfile.businessLogoUrl ?? undefined}
      />

      <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: "Invoice No.", value: payment.invoiceNumber },
            { label: "Client's Name", value: payment.customerName },
            { label: "Contact Number", value: payment.customerContactNumber || "—" },
            { label: "Plate Number", value: payment.vehiclePlateNumber || "—" },
          ]}
        />
        <MetadataColumn
          items={[
            { label: "Payment Date", value: formatDocumentDate(payment.paidAt) },
            { label: "Method", value: formatLabel(payment.paymentMethod) },
            { label: "Address", value: payment.customerAddress || "—" },
            { label: "Car Model & Year", value: formatVehicleModel(payment) },
          ]}
        />
      </section>

      <section className="report-section-keep mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: "Source", value: sourceLabel },
            { label: "Invoice Date", value: formatDocumentDate(payment.invoiceDate) },
            { label: "Reference No.", value: payment.referenceNumber || "—" },
            { label: "Received By", value: payment.receivedByName || "Not captured" },
          ]}
        />
        <MetadataColumn
          items={[
            { label: "Paid At", value: formatDateTime(payment.paidAt) },
            { label: "Invoice Status", value: formatLabel(payment.invoiceStatus) },
            { label: "VIN", value: payment.vehicleVin || "—" },
            { label: "Receiver Role", value: payment.receivedByTitle ? formatLabel(payment.receivedByTitle) : "—" },
          ]}
        />
      </section>

      <section className="report-section-keep mt-4 grid gap-4 sm:grid-cols-[1fr_250px]">
        <div className="space-y-4">
          <div>
            <ReportSectionHeading title="PAYMENT NOTES" />
            <div className="overflow-hidden border border-brand-border bg-brand-soft/25 px-3 py-2">
              <p className="font-semibold text-slate-800">Payment Notes</p>
              <p className="mt-1">{payment.notes || "No notes recorded for this payment."}</p>
            </div>
          </div>

          <div className="mt-8">
            <ReportSignatureBlock
              label="Received by:"
              name={payment.receivedByName || "Not captured"}
              subtitle={payment.receivedByTitle ? formatLabel(payment.receivedByTitle) : "No title captured"}
            />
          </div>
        </div>

        <div className="justify-self-end space-y-2">
          <ReportSectionHeading title="PAYMENT SUMMARY" />
          <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-3">
            <ReportTotals
              lines={[
                { label: "Invoice Total:", value: formatCurrency(payment.invoiceTotalAmount) },
                { label: "Balance Before:", value: formatCurrency(payment.invoiceBalanceBeforePayment) },
                { label: "Payment Amount:", value: formatCurrency(payment.amount), emphasized: true },
                { label: "Balance After:", value: formatCurrency(payment.invoiceBalanceAfterPayment) },
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
        <div key={item.label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
          <p className="font-semibold text-slate-800">{item.label}</p>
          <p className="min-w-0">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatVehicleModel(payment: PaymentPrintDocument["payment"]) {
  if (payment.vehicleMake && payment.vehicleModel) {
    const yearPart = payment.vehicleYear ? ` (${payment.vehicleYear})` : "";
    return `${payment.vehicleMake} ${payment.vehicleModel}${yearPart}`;
  }

  return payment.vehicleLabel;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
