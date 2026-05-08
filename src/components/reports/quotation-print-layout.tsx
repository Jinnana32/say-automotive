import { ReportFooter } from "@/components/reports/report-footer";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import { ReportTotals } from "@/components/reports/report-totals";
import { buildQuotationPrintBreakdown } from "@/features/quotations/report-utils";
import type { QuotationPrintDocument } from "@/features/quotations/types";
import { formatCurrency } from "@/lib/currency";
import { formatDocumentDate } from "@/lib/dates";

export function QuotationPrintLayout({
  document,
}: {
  document: QuotationPrintDocument;
}) {
  const { quotation, businessProfile } = document;
  const breakdown = buildQuotationPrintBreakdown(quotation);

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
                    <td className="px-2 py-1.5 text-right align-top">{formatPesoNumber(item.unitPrice)}</td>
                    <td className="px-2 py-1.5 text-right align-top">{formatPesoNumber(item.total)}</td>
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
                    <td className="px-2 py-1.5 text-right align-top">{formatPesoNumber(item.total)}</td>
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

      <section className="report-section-keep mt-8 grid gap-8 sm:grid-cols-[1fr_250px]">
        <div>
          <ReportSignatureBlock
            label="Prepared by:"
            name={quotation.preparedByName || "Not captured"}
            subtitle={quotation.preparedByTitle || "No title captured"}
          />
        </div>
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
      </section>

      <section className="report-section-keep mt-10 text-center text-[10px] text-slate-700">
        <p>By signing below, I agree to comply with all the terms and conditions as stated in this agreement.</p>
        <div className="mt-8">
          <ReportSignatureBlock label="Customer Signature" align="center" />
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

function formatVehicleModel(document: QuotationPrintDocument["quotation"]) {
  if (document.vehicleMake && document.vehicleModel) {
    const yearPart = document.vehicleYear ? ` (${document.vehicleYear})` : "";
    return `${document.vehicleMake} ${document.vehicleModel}${yearPart}`;
  }

  return document.vehicleLabel;
}

function formatPesoNumber(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
