import { ReportFooter } from '@/components/reports/report-footer';
import { ReportHeader } from '@/components/reports/report-header';
import { ReportSectionHeading } from '@/components/reports/report-section-heading';
import { ReportSignatureBlock } from '@/components/reports/report-signature-block';
import { ReportTotals } from '@/components/reports/report-totals';
import { buildJobOrderPrintBreakdown } from '@/features/job-orders/report-utils';
import type { JobOrderPrintDocument } from '@/features/job-orders/types';
import {
  formatJobOrderStatus,
  toTitleCaseWords,
} from '@/features/job-orders/utils';
import { formatCurrency, formatPrintCurrencyNumber } from '@/lib/currency';
import { formatDocumentDate, formatDateTime } from '@/lib/dates';

export function JobOrderPrintLayout({
  document,
  hidePrices = false,
}: {
  document: JobOrderPrintDocument;
  hidePrices?: boolean;
}) {
  const { jobOrder, businessProfile } = document;
  const breakdown = buildJobOrderPrintBreakdown(jobOrder);

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[12mm] py-[10mm] text-[11px] leading-[1.35] text-slate-900">
      <ReportHeader
        businessName={businessProfile.businessName}
        documentTitle="Job Order"
        documentMeta={`Job Order No.: ${jobOrder.jobOrderNumber} • Date: ${formatDocumentDate(jobOrder.createdAt)}`}
        logoSrc={businessProfile.businessLogoUrl ?? undefined}
      />

      <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: 'Job Order No.', value: jobOrder.jobOrderNumber },
            { label: 'Customer', value: jobOrder.customerName },
            {
              label: 'Contact Number',
              value: jobOrder.customerContactNumber || '—',
            },
            {
              label: 'Plate Number',
              value: jobOrder.vehiclePlateNumber || '—',
            },
          ]}
        />
        <MetadataColumn
          items={[
            { label: 'Date', value: formatDocumentDate(jobOrder.createdAt) },
            {
              label: 'Status',
              value: toTitleCaseWords(formatJobOrderStatus(jobOrder.status)),
            },
            { label: 'Address', value: jobOrder.customerAddress || '—' },
            { label: 'Car Model & Year', value: formatVehicleModel(jobOrder) },
          ]}
        />
      </section>

      <section className="report-section-keep mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            {
              label: 'Quotation',
              value: jobOrder.quotationNumber || 'Manual flow',
            },
            {
              label: 'Invoice',
              value: jobOrder.invoiceNumber || 'Not billed yet',
            },
            { label: 'Mileage In', value: formatMileage(jobOrder.mileageIn) },
            { label: 'Mileage Out', value: formatMileage(jobOrder.mileageOut) },
          ]}
        />
        <MetadataColumn
          items={[
            { label: 'Started', value: optionalDate(jobOrder.startedAt) },
            { label: 'Completed', value: optionalDate(jobOrder.completedAt) },
            { label: 'Released', value: optionalDate(jobOrder.releasedAt) },
            { label: 'VIN', value: jobOrder.vehicleVin || '—' },
          ]}
        />
      </section>

      <section className="report-section-keep mt-4 grid gap-3 sm:grid-cols-2">
        <NarrativeBlock
          title="Customer Concern"
          value={jobOrder.customerConcern}
        />
        <NarrativeBlock
          title="Inspection Notes"
          value={jobOrder.inspectionNotes}
        />
        <NarrativeBlock title="Diagnosis" value={jobOrder.diagnosis} />
        <NarrativeBlock title="Work Performed" value={jobOrder.workPerformed} />
      </section>

      <section className="mt-4">
        <ReportSectionHeading title="WORK ITEMS" />
        <div className="overflow-hidden border border-brand-border">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-brand-navy text-white">
              <tr>
                <th className="w-16 px-2 py-1.5 text-left font-semibold">
                  Type
                </th>
                <th className="px-2 py-1.5 text-left font-semibold">
                  Description
                </th>
                <th className="w-20 px-2 py-1.5 text-right font-semibold">
                  Qty
                </th>
                {!hidePrices ? (
                  <>
                    <th className="w-24 px-2 py-1.5 text-right font-semibold">
                      Unit Price
                    </th>
                    <th className="w-24 px-2 py-1.5 text-right font-semibold">
                      Total
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {breakdown.workLines.length > 0 ? (
                breakdown.workLines.map((item) => (
                  <tr
                    key={item.id}
                    className="report-row-avoid border-t border-slate-200"
                  >
                    <td className="px-2 py-1.5 align-top uppercase text-slate-700">
                      {item.itemType}
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <p>{item.description}</p>
                      {item.isAdditional ? (
                        <p className="text-[10px] text-slate-500">
                          Additional item
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.quantityLabel}
                    </td>
                    {!hidePrices ? (
                      <>
                        <td className="px-2 py-1.5 text-right align-top">
                          {formatPrintCurrencyNumber(item.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-right align-top">
                          {formatPrintCurrencyNumber(item.total)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td
                    colSpan={hidePrices ? 3 : 5}
                    className="px-2 py-3 text-center text-slate-500"
                  >
                    No work items recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4">
        <ReportSectionHeading title="PARTS USAGE" />
        <div className="overflow-hidden border border-brand-border">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-brand-navy text-white">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Part</th>
                <th className="w-16 px-2 py-1.5 text-right font-semibold">
                  Planned
                </th>
                <th className="w-16 px-2 py-1.5 text-right font-semibold">
                  Used
                </th>
                <th className="w-16 px-2 py-1.5 text-right font-semibold">
                  Returned
                </th>
                <th className="w-16 px-2 py-1.5 text-right font-semibold">
                  Remaining
                </th>
                <th className="w-20 px-2 py-1.5 text-right font-semibold">
                  Avail.
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.partUsageLines.length > 0 ? (
                breakdown.partUsageLines.map((item) => (
                  <tr
                    key={item.id}
                    className="report-row-avoid border-t border-slate-200"
                  >
                    <td className="px-2 py-1.5 align-top">
                      {item.description}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.plannedQuantity}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.usedQuantity}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.returnedQuantity}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.remainingQuantity}
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      {item.stockAvailability}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td
                    colSpan={6}
                    className="px-2 py-3 text-center text-slate-500"
                  >
                    No parts tracked on this job order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={`report-section-keep mt-4 grid gap-6 ${hidePrices ? 'sm:grid-cols-1' : 'sm:grid-cols-[1fr_250px]'}`}
      >
        <div className="space-y-20">
          <div>
            <ReportSectionHeading title="MECHANICS" />
            <div className="overflow-hidden border border-brand-border">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-brand-navy text-white">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobOrder.mechanics.length > 0 ? (
                    jobOrder.mechanics.map((mechanic) => (
                      <tr
                        key={mechanic.id}
                        className="report-row-avoid border-t border-slate-200"
                      >
                        <td className="px-2 py-1.5 align-top">
                          {mechanic.fullName}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-200">
                      <td className="px-2 py-3 text-center text-slate-500">
                        No mechanics assigned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <ReportSignatureBlock
            label="Prepared by:"
            name={jobOrder.preparedByName || 'Not captured'}
            subtitle={jobOrder.preparedByTitle || 'No title captured'}
          />
        </div>

        {!hidePrices ? (
          <div className="justify-self-end space-y-2">
            <ReportSectionHeading title="JOB ORDER SUMMARY" />
            <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-3">
              <ReportTotals
                lines={[
                  {
                    label: 'Parts:',
                    value: formatCurrency(breakdown.totalParts),
                  },
                  {
                    label: 'Labor:',
                    value: formatCurrency(breakdown.totalLabor),
                  },
                  {
                    label: 'Pending Extras:',
                    value: formatCurrency(breakdown.pendingExtras),
                  },
                  {
                    label: 'Rejected Extras:',
                    value: formatCurrency(breakdown.rejectedExtras),
                  },
                  {
                    label: 'Billable Total:',
                    value: formatCurrency(breakdown.billableTotal),
                    emphasized: true,
                  },
                  ...(jobOrder.invoiceId
                    ? [
                        {
                          label: 'Invoice Total:',
                          value: formatCurrency(
                            jobOrder.invoiceTotalAmount ?? 0,
                          ),
                        },
                        {
                          label: 'Balance:',
                          value: formatCurrency(jobOrder.invoiceBalance ?? 0),
                        },
                      ]
                    : []),
                ]}
                className="justify-self-end"
              />
            </div>
          </div>
        ) : (
          <></>
        )}
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

function NarrativeBlock({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <div className="rounded-md border border-slate-300 px-3 py-2">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1">{value || '—'}</p>
    </div>
  );
}

function formatVehicleModel(document: JobOrderPrintDocument['jobOrder']) {
  if (document.vehicleMake && document.vehicleModel) {
    const yearPart = document.vehicleYear ? ` (${document.vehicleYear})` : '';
    return `${document.vehicleMake} ${document.vehicleModel}${yearPart}`;
  }

  return document.vehicleLabel;
}

function formatMileage(value: number | null) {
  return value === null ? '—' : `${value.toLocaleString('en-PH')} km`;
}

function optionalDate(value: string | null) {
  return value ? formatDateTime(value) : '—';
}
