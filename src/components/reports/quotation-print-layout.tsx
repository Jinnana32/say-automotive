import { ReportFooter } from "@/components/reports/report-footer";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportTotals } from "@/components/reports/report-totals";
import { buildQuotationPrintBreakdown } from "@/features/quotations/report-utils";
import type { QuotationPrintDocument } from "@/features/quotations/types";
import {
  formatCurrency,
  formatPrintCurrencyNumber,
} from "@/lib/currency";
import { formatDocumentDate } from "@/lib/dates";

export function QuotationPrintLayout({
  document,
}: {
  document: QuotationPrintDocument;
}) {
  const { quotation, businessProfile } = document;
  const breakdown = buildQuotationPrintBreakdown(quotation);
  const defaultTerms = buildDefaultQuotationTerms();
  const serviceAdviserName = quotation.preparedByName || "Not captured";
  const serviceAdviserTitle = quotation.preparedByTitle || null;

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[12mm] py-[10mm] text-[11px] leading-[1.35] text-slate-900">
      <ReportHeader businessName={businessProfile.businessName} documentTitle="Job Quotation" />

      <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: "Control No.", value: quotation.quotationNumber },
            { label: "Client's Name", value: quotation.customerName },
            { label: "Contact Number", value: quotation.customerContactNumber || "—" },
            { label: "Plate Number", value: quotation.vehiclePlateNumber || "—" },
          ]}
        />
        <MetadataColumn
          items={[
            { label: "Date", value: formatDocumentDate(quotation.createdAt) },
            { label: "Address", value: quotation.customerAddress || "—" },
            { label: "Car Model & Year", value: formatVehicleModel(quotation) },
            { label: "VIN", value: quotation.vehicleVin || "—" },
            { label: "Service Adviser", value: serviceAdviserName },
          ]}
        />
      </section>

      <section className="report-section-keep mt-4">
        <p className="font-semibold text-slate-800">Nature of Repair</p>
        <p className="mt-1">{quotation.natureOfRepair || "—"}</p>
      </section>

      <section className="mt-4">
        <h2 className="font-display text-[18px] font-semibold uppercase text-slate-950">PART:</h2>
        <div className="mt-1 overflow-hidden border border-slate-300">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Description</th>
                <th className="w-24 px-2 py-1.5 text-left font-semibold">Qty/Unit</th>
                <th className="w-24 px-2 py-1.5 text-right font-semibold">Price (₱)</th>
                <th className="w-24 px-2 py-1.5 text-right font-semibold">Total (₱)</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.partLines.length > 0 ? (
                breakdown.partLines.map((item) => (
                  <tr key={item.id} className="report-row-avoid border-t border-slate-200">
                    <td className="px-2 py-1.5 align-top">{item.description}</td>
                    <td className="px-2 py-1.5 align-top">{item.quantityLabel}</td>
                    <td className="px-2 py-1.5 text-right align-top">{formatPrintCurrencyNumber(item.unitPrice)}</td>
                    <td className="px-2 py-1.5 text-right align-top">{formatPrintCurrencyNumber(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="px-2 py-3 text-center text-slate-500">
                    No quoted parts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="font-display text-[18px] font-semibold uppercase text-slate-950">LABOR:</h2>
        <div className="mt-1 overflow-hidden border border-slate-300">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Description</th>
                <th className="w-28 px-2 py-1.5 text-right font-semibold">Price (₱)</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.laborLines.length > 0 ? (
                breakdown.laborLines.map((item) => (
                  <tr key={item.id} className="report-row-avoid border-t border-slate-200">
                    <td className="px-2 py-1.5 align-top">{item.description}</td>
                    <td className="px-2 py-1.5 text-right align-top">{formatPrintCurrencyNumber(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td colSpan={2} className="px-2 py-3 text-center text-slate-500">
                    No quoted labor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section-keep mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_250px]">
        <div className="space-y-5">
          <QuotationTermsSection terms={defaultTerms} />
          <ServiceAdviserSection name={serviceAdviserName} title={serviceAdviserTitle} />
        </div>
        <div className="space-y-5">
          <ReportTotals
            lines={[
              { label: "Total Parts:", value: formatCurrency(breakdown.totalParts) },
              { label: "Total Labor:", value: formatCurrency(breakdown.totalLabor) },
              { label: "Discount:", value: formatCurrency(breakdown.discount) },
              ...(breakdown.tax > 0 ? [{ label: "Tax:", value: formatCurrency(breakdown.tax) }] : []),
              { label: "TOTAL:", value: formatCurrency(breakdown.grandTotal), emphasized: true },
            ]}
            className="justify-self-end"
          />
          <CustomerApprovalSection />
        </div>
      </section>

      <ReportFooter
        contactNumber={businessProfile.businessContact}
        email={businessProfile.businessEmail}
        address={businessProfile.businessAddress}
      />
    </article>
  );
}

function QuotationTermsSection({
  terms,
}: {
  terms: string[];
}) {
  return (
    <section className="report-section-keep border border-slate-300 px-4 py-4">
      <p className="font-semibold text-slate-800">Terms &amp; Notes</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] text-slate-700">
        {terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
    </section>
  );
}

function CustomerApprovalSection() {
  return (
    <section className="report-section-keep border border-slate-300 px-4 py-4">
      <p className="font-semibold text-slate-800">Customer Approval</p>
      <p className="mt-2 text-[10px] text-slate-700">
        I have reviewed this quotation and approve the services and costs as listed above.
      </p>
      <div className="mt-4 space-y-3">
        <SignatureLine label="Signature" />
        <SignatureLine label="Print Name" />
        <SignatureLine label="Date" />
      </div>
    </section>
  );
}

function ServiceAdviserSection({
  name,
  title,
}: {
  name: string;
  title: string | null;
}) {
  return (
    <section className="report-section-keep border border-slate-300 px-4 py-4">
      <p className="font-semibold text-slate-800">Service Adviser</p>
      <p className="mt-2 text-[10px] text-slate-700">
        Prepared and discussed by the assigned service adviser before customer approval.
      </p>
      <div className="mt-4 space-y-3">
        <SignatureLine label="Signature" />
        <SignatureLine label="Print Name" value={name} />
        {title ? (
          <p className="pl-[86px] text-[10px] text-slate-600">{title}</p>
        ) : null}
      </div>
    </section>
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

function SignatureLine({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-end gap-2">
      <p className="text-[10px] font-semibold text-slate-700">{label}:</p>
      <div className="min-h-[20px] border-b border-slate-500 pb-0.5 text-[10.5px] text-slate-950">
        {value?.trim() || "\u00A0"}
      </div>
    </div>
  );
}

function buildDefaultQuotationTerms() {
  return [
    "Prices are inclusive of parts and labor unless otherwise stated.",
    "This quotation is non-binding until approved and confirmed.",
    "Parts and services are warranted for 30 days or 1,000 km, whichever comes first.",
    "Price may change without prior notice if additional work or parts are required upon further inspection.",
    "Thank you for choosing SAY Auto Care.",
  ];
}

function formatVehicleModel(document: QuotationPrintDocument["quotation"]) {
  if (document.vehicleMake && document.vehicleModel) {
    const yearPart = document.vehicleYear ? ` (${document.vehicleYear})` : "";
    return `${document.vehicleMake} ${document.vehicleModel}${yearPart}`;
  }

  return document.vehicleLabel;
}
