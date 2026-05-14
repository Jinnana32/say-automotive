/* eslint-disable @next/next/no-img-element */

import { buildQuotationPrintBreakdown } from '@/features/quotations/report-utils';
import type {
  QuotationItemDetail,
  QuotationPrintDocument,
} from '@/features/quotations/types';
import { formatCurrency, formatPrintCurrencyNumber } from '@/lib/currency';
import { formatDocumentDate } from '@/lib/dates';

export function QuotationPrintLayout({
  document,
}: {
  document: QuotationPrintDocument;
}) {
  const {
    quotation,
    businessProfile,
    customerSnapshot,
    vehicleSnapshot,
    validUntil,
  } = document;
  const breakdown = buildQuotationPrintBreakdown(quotation);
  const lineItems = buildQuotationLineRows(quotation.items);
  const natureOfRepair = getPrintableText(quotation.natureOfRepair);
  const serviceAdviserName = quotation.preparedByName || 'Not captured';
  const serviceAdviserTitle = quotation.preparedByTitle || 'Service Adviser';

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[11mm] py-[9mm] text-[11px] leading-[1.42] text-slate-900">
      <QuotationPrintHeader
        businessName={businessProfile.businessName}
        logoSrc={businessProfile.businessLogoUrl}
        quotationNumber={quotation.quotationNumber}
        quotationDate={quotation.createdAt}
      />

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <QuotationInfoPanel
          title="CUSTOMER DETAILS"
          rows={[
            { label: 'Name', value: quotation.customerName },
            { label: 'Company', value: customerSnapshot.companyName || '—' },
            { label: 'Phone', value: quotation.customerContactNumber || '—' },
            { label: 'Email', value: customerSnapshot.email || '—' },
            { label: 'Address', value: quotation.customerAddress || '—' },
          ]}
        />
        <QuotationInfoPanel
          title="VEHICLE INFORMATION"
          rows={[
            { label: 'Make / Model', value: formatVehicleModel(quotation) },
            {
              label: 'Year',
              value: quotation.vehicleYear
                ? String(quotation.vehicleYear)
                : '—',
            },
            { label: 'Color', value: vehicleSnapshot.color || '—' },
            { label: 'VIN', value: quotation.vehicleVin || '—' },
            { label: 'Mileage', value: formatMileage(vehicleSnapshot.mileage) },
            { label: 'Plate No.', value: quotation.vehiclePlateNumber || '—' },
          ]}
        />
      </section>

      {natureOfRepair ? (
        <section className="report-section-keep mt-4">
          <div className="border border-brand-border">
            <div className="bg-brand-navy px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.24em] text-white">
              NATURE OF REPAIR
            </div>
            <div className="px-4 py-3.5 text-[11px] leading-[1.48] text-slate-800">
              {natureOfRepair}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="bg-brand-navy px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.24em] text-white">
            QUOTED SERVICES
          </span>
          <span className="h-[2px] flex-1 bg-brand-border" />
        </div>
        <div className="overflow-hidden border border-brand-border">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-brand-navy text-white">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left font-semibold">#</th>
                <th className="px-3 py-2.5 text-left font-semibold">
                  Description
                </th>
                <th className="w-24 px-3 py-2.5 text-left font-semibold">
                  Qty
                </th>
                <th className="w-32 px-3 py-2.5 text-right font-semibold">
                  Unit Price
                </th>
                <th className="w-32 px-3 py-2.5 text-right font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length > 0 ? (
                lineItems.map((row) =>
                  row.kind === 'group' ? (
                    <tr
                      key={row.key}
                      className="border-t border-slate-200 bg-slate-50"
                    >
                      <td
                        colSpan={5}
                        className="border-t border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-navy"
                      >
                        {row.label}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={row.key}
                      className="report-row-avoid border-t border-slate-200"
                    >
                      <td className="px-3 py-3.5 align-top text-slate-700">
                        {row.displayLineNumber}
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <p className="font-semibold leading-[1.35] text-slate-950">
                          {row.description}
                        </p>
                        {row.subtext ? (
                          <p className="mt-1 text-[9.5px] leading-[1.35] text-slate-600">
                            {row.subtext}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5 align-top text-slate-700">
                        {row.quantityLabel}
                      </td>
                      <td className="px-3 py-3.5 text-right align-top text-slate-800">
                        {formatPrintCurrencyNumber(row.unitPrice)}
                      </td>
                      <td className="px-3 py-3.5 text-right align-top font-semibold text-slate-950">
                        {formatPrintCurrencyNumber(row.amount)}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr className="border-t border-slate-200">
                  <td
                    colSpan={5}
                    className="px-3 py-5 text-center text-slate-500"
                  >
                    No quoted services.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section-keep mt-5 grid items-stretch gap-4 sm:grid-cols-[minmax(0,1fr)_280px]">
        <QuotationTermsSection terms={buildDefaultQuotationTerms(validUntil)} />
        <QuotationTotalsPanel breakdown={breakdown} />
      </section>

      <section className="report-section-keep mt-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
          APPROVAL
        </p>
        <div className="mt-2 h-px bg-brand-border" />
        <div className="grid gap-5 pt-4 sm:grid-cols-[1.15fr_1fr_1fr]">
          <div className="text-[10.5px] leading-[1.6] text-slate-700">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-800">
              Authorization
            </p>
            <p className="mt-2.5 max-w-[240px]">
              I have read and agree to the terms and conditions stated above and
              authorize SAY Auto Care to proceed with the listed services.
            </p>
          </div>
          <div className="space-y-4">
            <SignatureLine label="Customer Signature" />
            <SignatureLine
              label="Printed Name"
              value={quotation.customerName}
            />
            <SignatureLine label="Date" />
          </div>
          <div className="border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-700">
              Prepared By
            </p>
            <div className="mt-3 space-y-4">
              <SignatureLine label="Adviser Signature" />
              <SignatureLine label="Printed Name" value={serviceAdviserName} />
              <div className="grid grid-cols-[110px_minmax(0,1fr)] items-end gap-3">
                <p className="text-[10.5px] font-semibold text-slate-700">
                  Role:
                </p>
                <p className="text-[10.5px] text-slate-600">
                  {serviceAdviserTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuotationFooter
        businessName={businessProfile.businessName}
        vatRegistrationNo={businessProfile.businessVatRegistrationNo}
        contactNumber={businessProfile.businessContact}
        email={businessProfile.businessEmail}
        address={businessProfile.businessAddress}
      />
    </article>
  );
}

function QuotationPrintHeader({
  businessName,
  logoSrc,
  quotationNumber,
  quotationDate,
}: {
  businessName: string;
  logoSrc: string | null;
  quotationNumber: string;
  quotationDate: string;
}) {
  return (
    <header className="report-section-keep border-b-2 border-brand-border pb-3">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:items-center">
        <div className="flex items-center">
          <div className="max-w-[170px] shrink-0 sm:max-w-[188px]">
            <img
              src={logoSrc ?? '/say-auto-care-logo.jpeg'}
              alt={businessName}
              className="h-auto max-h-[102px] w-auto max-w-[188px] object-contain"
            />
          </div>
        </div>
        <div className="sm:text-right">
          <p className="font-display text-[34px] font-semibold leading-none tracking-[0.08em] text-brand-navy sm:text-[38px]">
            QUOTATION
          </p>
          <div className="mt-2 h-[2px] w-32 bg-brand-red sm:ml-auto" />
          <p className="mt-2 text-[10.5px] font-medium leading-[1.45] text-slate-700 sm:text-[11px]">
            {buildCompactHeaderMeta(quotationNumber, quotationDate)}
          </p>
        </div>
      </div>
    </header>
  );
}

function QuotationInfoPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="report-section-keep">
      <div className="flex items-center gap-3">
        <span className="bg-brand-navy px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.24em] text-white">
          {title}
        </span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 text-[10.5px]"
          >
            <p className="font-semibold text-slate-800">{row.label}</p>
            <p className="min-w-0 break-words text-slate-900">
              {row.value || '—'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuotationTermsSection({ terms }: { terms: string[] }) {
  return (
    <section className="report-section-keep">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
        TERMS &amp; CONDITIONS
      </p>
      <div className="mt-2 h-px bg-brand-border" />
      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[10.5px] leading-[1.5] text-slate-700">
        {terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
    </section>
  );
}

function QuotationTotalsPanel({
  breakdown,
}: {
  breakdown: ReturnType<typeof buildQuotationPrintBreakdown>;
}) {
  const totalLines = [
    { label: 'Subtotal', value: formatCurrency(breakdown.subtotal) },
    ...(breakdown.discount > 0
      ? [{ label: 'Discount', value: formatCurrency(breakdown.discount) }]
      : []),
    ...(breakdown.tax > 0
      ? [{ label: 'Tax / VAT', value: formatCurrency(breakdown.tax) }]
      : []),
  ];

  return (
    <section className="flex h-full flex-col justify-between overflow-hidden border border-brand-border bg-brand-soft/35">
      <div className="flex-1 px-4 pt-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
          QUOTATION SUMMARY
        </p>
        <div className="mt-2 h-px bg-brand-border" />
        <table className="mt-3 w-full border-collapse text-[11px]">
          <tbody>
            {totalLines.map((line) => (
              <tr
                key={line.label}
                className="border-b border-slate-200 last:border-b-0"
              >
                <td className="py-1.5 pr-4 font-semibold text-slate-700">
                  {line.label}
                </td>
                <td className="py-1.5 text-right font-semibold text-slate-900">
                  {line.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t-2 border-brand-red bg-brand-navy px-4 py-3 text-white">
        <div className="flex items-end justify-between gap-4">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em]">
            TOTAL QUOTATION
          </span>
          <span className="text-[22px] font-semibold leading-none">
            {formatCurrency(breakdown.grandTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}

function QuotationFooter({
  businessName,
  vatRegistrationNo,
  contactNumber,
  email,
  address,
}: {
  businessName: string;
  vatRegistrationNo: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
}) {
  return (
    <footer className="mt-auto pt-5">
      <div className="border-t-2 border-brand-red pt-3">
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="min-w-[190px]">
            <p className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-navy">
              {businessName}
            </p>
            <p className="mt-1.5 text-[9.5px] font-medium text-slate-600">
              VAT Reg. No.: {vatRegistrationNo?.trim() || 'Not configured'}
            </p>
          </div>
          <div className="grid flex-1 gap-3 text-[10px] text-slate-700 sm:grid-cols-3">
            <FooterDetail label="Contact" value={contactNumber} />
            <FooterDetail label="Email" value={email} />
            <FooterDetail label="Address" value={address} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between bg-brand-navy px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.26em] text-white">
        <span>{businessName}</span>
        <span className="h-[3px] w-16 bg-brand-red" />
      </div>
    </footer>
  );
}

function FooterDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="font-semibold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 break-words text-slate-900">
        {value?.trim() || '—'}
      </p>
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
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-end gap-3">
      <p className="text-[10.5px] font-semibold text-slate-700">{label}:</p>
      <div className="min-h-[24px] border-b-2 border-slate-500 pb-0.5 text-[11px] text-slate-950">
        {value?.trim() || '\u00A0'}
      </div>
    </div>
  );
}

function buildCompactHeaderMeta(
  quotationNumber: string,
  quotationDate: string,
) {
  return `Quotation #: ${quotationNumber} - Date: ${formatDocumentDate(quotationDate)}`;
}

type QuotationLineRow =
  | { kind: 'group'; key: string; label: 'PARTS' | 'LABOR' }
  | {
      kind: 'item';
      key: string;
      displayLineNumber: number;
      description: string;
      subtext: string | null;
      quantityLabel: string;
      unitPrice: number;
      amount: number;
    };

function buildQuotationLineRows(
  items: QuotationItemDetail[],
): QuotationLineRow[] {
  const partItems = items.filter((item) => item.itemType === 'product');
  const laborItems = items.filter(
    (item) => item.itemType === 'service' || item.itemType === 'labor',
  );

  const rows: QuotationLineRow[] = [];
  let displayLineNumber = 1;

  if (partItems.length > 0) {
    rows.push({ kind: 'group', key: 'parts-group', label: 'PARTS' });
    rows.push(
      ...partItems.map((item) => ({
        kind: 'item' as const,
        key: item.id,
        displayLineNumber: displayLineNumber++,
        description: item.description,
        subtext: item.unitLabel ? `Unit: ${item.unitLabel}` : null,
        quantityLabel: formatQuantity(item.quantity, item.unitLabel),
        unitPrice: item.unitPrice,
        amount: item.total,
      })),
    );
  }

  if (laborItems.length > 0) {
    rows.push({ kind: 'group', key: 'labor-group', label: 'LABOR' });
    rows.push(
      ...laborItems.map((item) => ({
        kind: 'item' as const,
        key: item.id,
        displayLineNumber: displayLineNumber++,
        description: item.description,
        subtext: item.itemType === 'service' ? 'Service' : 'Labor',
        quantityLabel: formatQuantity(item.quantity, null),
        unitPrice: item.unitPrice,
        amount: item.total,
      })),
    );
  }

  return rows;
}

function formatQuantity(quantity: number, unitLabel: string | null) {
  const numeric = Number.isInteger(quantity)
    ? String(quantity)
    : String(quantity);
  return unitLabel ? `${numeric} ${unitLabel}` : numeric;
}

function buildDefaultQuotationTerms(validUntil: string | null) {
  const validityText = validUntil
    ? `This quotation is valid until ${formatDocumentDate(validUntil)}.`
    : 'This quotation is valid until the date stated above.';

  return [
    validityText,
    'Prices are inclusive of parts and labor unless otherwise stated.',
    'This quotation is non-binding until approved and confirmed.',
    'Parts and services are warranted for 30 days or 1,000 km, whichever comes first.',
    'Price may change without prior notice if additional work or parts are required upon further inspection.',
    'Thank you for choosing SAY Auto Care.',
  ];
}

function formatVehicleModel(document: QuotationPrintDocument['quotation']) {
  if (document.vehicleMake && document.vehicleModel) {
    const yearPart = document.vehicleYear ? ` (${document.vehicleYear})` : '';
    return `${document.vehicleMake} ${document.vehicleModel}${yearPart}`;
  }

  return document.vehicleLabel;
}

function formatMileage(value: number | null) {
  if (value === null) {
    return '—';
  }

  return `${new Intl.NumberFormat('en-PH').format(value)} km`;
}

function getPrintableText(value: string | null) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === '—' || trimmed === '-') {
    return null;
  }

  return trimmed;
}
