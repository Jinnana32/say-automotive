import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import { ReportTotals } from "@/components/reports/report-totals";
import {
  buildJobOrderPrintBreakdown,
  type JobOrderPrintPartsUsageLine,
  type JobOrderPrintWorkLine,
} from "@/features/job-orders/report-utils";
import type { JobOrderPrintDocument } from "@/features/job-orders/types";
import {
  formatJobOrderStatus,
  toTitleCaseWords,
} from "@/features/job-orders/utils";
import {
  formatDocumentPrintCurrency,
  formatDocumentPrintCurrencyNumber,
} from "@/lib/currency";
import { formatDocumentDate, formatDateTime } from "@/lib/dates";

const JOB_ORDER_PAGE_CAPACITY = 18.8;
const JOB_ORDER_CONTINUATION_CAPACITY = 19;

type JobOrderWorkGroupLabel = "Services / Labor" | "Parts / Products";

type JobOrderWorkTableRow =
  | { kind: "group"; key: string; label: JobOrderWorkGroupLabel }
  | { kind: "item"; key: string; item: JobOrderPrintWorkLine };

type JobOrderPrintPageModel = {
  key: string;
  workRows: JobOrderWorkTableRow[];
  partUsageRows: JobOrderPrintPartsUsageLine[];
  includeIntro: boolean;
  includeClosing: boolean;
};

export function JobOrderPrintLayout({
  document,
  hidePrices = false,
}: {
  document: JobOrderPrintDocument;
  hidePrices?: boolean;
}) {
  const { jobOrder, businessProfile } = document;
  const breakdown = buildJobOrderPrintBreakdown(jobOrder);
  const workRows = buildJobOrderWorkRows(breakdown.workLines);
  const optionalNarratives = buildOptionalNarrativeBlocks(jobOrder);
  const pages = buildJobOrderPrintPages({
    workRows,
    partUsageRows: breakdown.partUsageLines,
    mechanicCount: jobOrder.mechanics.length,
    hidePrices,
    optionalNarrativeCount: optionalNarratives.length,
  });

  return (
    <PrintPageStack className="job-order-print-document leading-[1.32]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          className="job-order-print-page leading-[1.32]"
          bodyClassName="job-order-print-body pb-[5mm]"
          topPaddingClassName="pt-[7mm]"
          bottomPaddingClassName="pb-[6mm]"
          compactHeader={index > 0}
          businessProfile={businessProfile}
          documentTitle="Job Order"
          documentMeta={buildJobOrderHeaderMeta(
            jobOrder.jobOrderNumber,
            jobOrder.createdAt,
            jobOrder.status,
          )}
        >
          {page.includeIntro ? (
            <>
              <section className="report-section-keep mt-3.5 grid gap-x-7 gap-y-1.25 sm:grid-cols-2">
                <MetadataColumn
                  items={[
                    { label: "Job Order No.", value: jobOrder.jobOrderNumber },
                    { label: "Customer", value: jobOrder.customerName },
                    {
                      label: "Contact Number",
                      value: jobOrder.customerContactNumber || "—",
                    },
                    {
                      label: "Plate Number",
                      value: jobOrder.vehiclePlateNumber || "—",
                    },
                  ]}
                />
                <MetadataColumn
                  items={[
                    { label: "Date", value: formatDocumentDate(jobOrder.createdAt) },
                    {
                      label: "Status",
                      value: toTitleCaseWords(formatJobOrderStatus(jobOrder.status)),
                    },
                    { label: "Address", value: jobOrder.customerAddress || "—" },
                    { label: "Car Model & Year", value: formatVehicleModel(jobOrder) },
                  ]}
                />
              </section>

              <section className="report-section-keep mt-2 grid gap-x-7 gap-y-1.25 sm:grid-cols-2">
                <MetadataColumn
                  items={[
                    {
                      label: "Quotation",
                      value: jobOrder.quotationNumber || "Manual flow",
                    },
                    {
                      label: "Invoice",
                      value: jobOrder.invoiceNumber || "Not billed yet",
                    },
                    { label: "Mileage In", value: formatMileage(jobOrder.mileageIn) },
                    { label: "Mileage Out", value: formatMileage(jobOrder.mileageOut) },
                  ]}
                />
                <MetadataColumn
                  items={[
                    { label: "Started", value: optionalDate(jobOrder.startedAt) },
                    { label: "Completed", value: optionalDate(jobOrder.completedAt) },
                    { label: "Released", value: optionalDate(jobOrder.releasedAt) },
                    { label: "VIN", value: jobOrder.vehicleVin || "—" },
                  ]}
                />
              </section>

              {optionalNarratives.length > 0 ? (
                <section className="report-section-keep mt-3 grid gap-2.5 sm:grid-cols-2">
                  {optionalNarratives.map((block) => (
                    <NarrativeBlock
                      key={block.title}
                      title={block.title}
                      value={block.value}
                    />
                  ))}
                </section>
              ) : null}
            </>
          ) : null}

          {page.workRows.length > 0 || page.includeIntro ? (
            <WorkItemsSection rows={page.workRows} hidePrices={hidePrices} />
          ) : null}

          {page.includeClosing ? (
            <div className="job-order-print-closing flex flex-col gap-2.5 pt-2">
              {page.partUsageRows.length > 0 ? (
                <PartUsageSection rows={page.partUsageRows} />
              ) : null}
              <section
                className={`job-order-print-closing report-section-keep grid gap-3 ${hidePrices ? "sm:grid-cols-1" : "sm:grid-cols-[1fr_236px]"}`}
              >
                <div className="space-y-3">
                  {jobOrder.mechanics.length > 0 ? (
                    <div>
                      <ReportSectionHeading title="MECHANICS" />
                      <div className="overflow-hidden border border-brand-border">
                        <table className="w-full border-collapse text-[11px]">
                          <thead className="bg-brand-navy text-white">
                            <tr>
                              <th className="px-2 py-1 text-left font-semibold">
                                Name
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobOrder.mechanics.map((mechanic) => (
                              <tr
                                key={mechanic.id}
                                className="report-row-avoid border-t border-slate-200"
                              >
                                <td className="px-2 py-1 align-top">
                                  {mechanic.fullName}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  <ReportSignatureBlock
                    className="job-order-print-prepared-by"
                    label="Prepared by:"
                    name={jobOrder.preparedByName || "Prepared by current user"}
                    subtitle={jobOrder.preparedByTitle}
                  />
                </div>

                {!hidePrices ? (
                  <div className="job-order-print-summary justify-self-end space-y-1">
                    <ReportSectionHeading title="JOB ORDER SUMMARY" />
                    <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-1.5">
                      <ReportTotals
                        lines={[
                          {
                            label: "Parts:",
                            value: formatDocumentPrintCurrency(breakdown.totalParts),
                          },
                          {
                            label: "Labor:",
                            value: formatDocumentPrintCurrency(breakdown.totalLabor),
                          },
                          {
                            label: "Pending Extras:",
                            value: formatDocumentPrintCurrency(breakdown.pendingExtras),
                          },
                          {
                            label: "Rejected Extras:",
                            value: formatDocumentPrintCurrency(breakdown.rejectedExtras),
                          },
                          {
                            label: "Billable Total:",
                            value: formatDocumentPrintCurrency(breakdown.billableTotal),
                            emphasized: true,
                          },
                          ...(jobOrder.invoiceId
                            ? [
                                {
                                  label: "Invoice Total:",
                                  value: formatDocumentPrintCurrency(jobOrder.invoiceTotalAmount ?? 0),
                                },
                                {
                                  label: "Balance:",
                                  value: formatDocumentPrintCurrency(jobOrder.invoiceBalance ?? 0),
                                },
                              ]
                            : []),
                        ]}
                        className="justify-self-end"
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          ) : page.partUsageRows.length > 0 ? (
            <PartUsageSection rows={page.partUsageRows} />
          ) : null}
        </PrintDocumentPage>
      ))}
    </PrintPageStack>
  );
}

function WorkItemsSection({
  rows,
  hidePrices,
}: {
  rows: JobOrderWorkTableRow[];
  hidePrices: boolean;
}) {
  return (
    <section className="report-section-keep mt-3">
      <ReportSectionHeading title="WORK ITEMS" />
      <div className="overflow-hidden border border-brand-border">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="w-10 px-2 py-1 text-center font-semibold">Done</th>
              <th className="px-2 py-1 text-left font-semibold">Description</th>
              <th className="w-[52px] px-2 py-1 text-right font-semibold">Qty</th>
              {!hidePrices ? (
                <>
                  <th className="w-24 px-2 py-1 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="w-24 px-2 py-1 text-right font-semibold">
                    Total
                  </th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) =>
                row.kind === "group" ? (
                  <tr key={row.key} className="border-t border-slate-200 bg-brand-soft/40">
                    <td
                      colSpan={hidePrices ? 3 : 5}
                      className="px-2 py-1 text-left text-[9.75px] font-semibold uppercase tracking-[0.12em] text-brand-navy"
                    >
                      {row.label}
                    </td>
                  </tr>
                ) : (
                  <tr key={row.key} className="report-row-avoid border-t border-slate-200">
                    <td className="px-2 py-1 text-center align-top">
                      <ChecklistGlyph completed={row.item.checklistCompleted} />
                    </td>
                    <td className="px-2 py-1 align-top">
                      <p className="leading-[1.24]">{row.item.description}</p>
                      {row.item.isAdditional ||
                      (row.item.checklistCompleted && row.item.checklistCheckedAt) ? (
                        <div className="mt-0.5 space-y-0.5 text-[9.75px] leading-[1.25] text-slate-500">
                          {row.item.isAdditional ? <p>Additional item</p> : null}
                          {row.item.checklistCompleted && row.item.checklistCheckedAt ? (
                            <p>
                              Completed {formatDateTime(row.item.checklistCheckedAt)}
                              {row.item.checklistCheckedByName
                                ? ` • ${row.item.checklistCheckedByName}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      {row.item.quantityLabel}
                    </td>
                    {!hidePrices ? (
                      <>
                        <td className="px-2 py-1 text-right align-top">
                          {formatDocumentPrintCurrencyNumber(row.item.unitPrice)}
                        </td>
                        <td className="px-2 py-1 text-right align-top">
                          {formatDocumentPrintCurrencyNumber(row.item.total)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ),
              )
            ) : (
              <tr className="border-t border-slate-200">
                <td
                  colSpan={hidePrices ? 3 : 5}
                  className="px-2 py-2.5 text-center text-slate-500"
                >
                  No work items recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PartUsageSection({
  rows,
}: {
  rows: JobOrderPrintPartsUsageLine[];
}) {
  return (
    <section className="report-section-keep mt-2.5">
      <ReportSectionHeading title="PARTS USAGE" />
      <div className="overflow-hidden border border-brand-border">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="px-2 py-1 text-left font-semibold">Part</th>
              <th className="w-16 px-2 py-1 text-right font-semibold">Planned</th>
              <th className="w-16 px-2 py-1 text-right font-semibold">Used</th>
              <th className="w-16 px-2 py-1 text-right font-semibold">Returned</th>
              <th className="w-16 px-2 py-1 text-right font-semibold">Remaining</th>
              <th className="w-20 px-2 py-1 text-right font-semibold">Avail.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item) => (
                <tr key={item.id} className="report-row-avoid border-t border-slate-200">
                  <td className="px-2 py-1 align-top">{item.description}</td>
                  <td className="px-2 py-1 text-right align-top">{item.plannedQuantity}</td>
                  <td className="px-2 py-1 text-right align-top">{item.usedQuantity}</td>
                  <td className="px-2 py-1 text-right align-top">{item.returnedQuantity}</td>
                  <td className="px-2 py-1 text-right align-top">{item.remainingQuantity}</td>
                  <td className="px-2 py-1 text-right align-top">{item.stockAvailability}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-200">
                <td colSpan={6} className="px-2 py-2.5 text-center text-slate-500">
                  No parts tracked on this job order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    <div className="space-y-0.5">
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
      <p className="mt-0.5 leading-[1.35]">{value || "—"}</p>
    </div>
  );
}

function ChecklistGlyph({ completed }: { completed: boolean }) {
  return (
    <span
      aria-label={completed ? "Completed" : "Open"}
      className="inline-flex min-w-[14px] items-center justify-center text-[12px] leading-none"
    >
      {completed ? "☑" : "☐"}
    </span>
  );
}

function buildJobOrderHeaderMeta(
  jobOrderNumber: string,
  createdAt: string,
  status: JobOrderPrintDocument["jobOrder"]["status"],
) {
  return `Job Order #: ${jobOrderNumber} • Date: ${formatDocumentDate(createdAt)} • Status: ${toTitleCaseWords(formatJobOrderStatus(status))}`;
}

function buildJobOrderWorkRows(workLines: JobOrderPrintWorkLine[]) {
  const groups: Array<{
    key: string;
    label: JobOrderWorkGroupLabel;
    items: JobOrderPrintWorkLine[];
  }> = [
    {
      key: "services-labor",
      label: "Services / Labor" as const,
      items: workLines.filter(
        (item) => item.itemType === "service" || item.itemType === "labor",
      ),
    },
    {
      key: "parts-products",
      label: "Parts / Products" as const,
      items: workLines.filter((item) => item.itemType === "product"),
    },
  ].filter((group) => group.items.length > 0);

  return groups.flatMap<JobOrderWorkTableRow>((group) => [
    { kind: "group", key: `${group.key}-group`, label: group.label },
    ...group.items.map((item) => ({
      kind: "item" as const,
      key: item.id,
      item,
    })),
  ]);
}

function buildJobOrderPrintPages(params: {
  workRows: JobOrderWorkTableRow[];
  partUsageRows: JobOrderPrintPartsUsageLine[];
  mechanicCount: number;
  hidePrices: boolean;
  optionalNarrativeCount: number;
}): JobOrderPrintPageModel[] {
  const {
    workRows,
    partUsageRows,
    mechanicCount,
    hidePrices,
    optionalNarrativeCount,
  } = params;
  const introUnits = getJobOrderIntroUnits(optionalNarrativeCount);
  const mechanicsUnits =
    mechanicCount > 0 ? Math.min(mechanicCount * 0.24 + 0.75, 1.95) : 0;
  const signatureUnits = 0.78;
  const summaryUnits = hidePrices ? 0.92 : 2.25;
  const closingBaseUnits = mechanicsUnits + signatureUnits + summaryUnits + 0.6;
  const totalWorkUnits = estimateJobOrderWorkRowsUnits(workRows);
  const totalPartUsageUnits = estimatePartUsageRowsUnits(partUsageRows);

  if (
    introUnits + totalWorkUnits + totalPartUsageUnits + closingBaseUnits <= JOB_ORDER_PAGE_CAPACITY
  ) {
    return [
      {
        key: "job-order-page-1",
        workRows,
        partUsageRows,
        includeIntro: true,
        includeClosing: true,
      },
    ];
  }

  const pages: JobOrderPrintPageModel[] = [];
  const firstPage = takeJobOrderWorkRowsForCapacity(
    workRows,
    0,
    null,
    Math.max(3.5, JOB_ORDER_PAGE_CAPACITY - introUnits),
  );

  const firstPageWorkUnits = estimateJobOrderWorkRowsUnits(firstPage.rows);
  let firstPagePartUsageRows: JobOrderPrintPartsUsageLine[] = [];
  let firstPagePartUsageIndex = 0;

  if (firstPage.nextIndex === workRows.length && partUsageRows.length > 0) {
    const firstPageRemainingCapacity = Math.max(
      0,
      JOB_ORDER_PAGE_CAPACITY - introUnits - firstPageWorkUnits,
    );
    const firstPagePartChunk = takePartUsageRowsForCapacity(
      partUsageRows,
      0,
      firstPageRemainingCapacity,
    );

    firstPagePartUsageRows = firstPagePartChunk.rows;
    firstPagePartUsageIndex = firstPagePartChunk.nextIndex;
  }

  pages.push({
    key: "job-order-page-1",
    workRows: firstPage.rows,
    partUsageRows: firstPagePartUsageRows,
    includeIntro: true,
    includeClosing: false,
  });

  let workIndex = firstPage.nextIndex;
  let activeGroup = firstPage.activeGroup;
  let pageNumber = 2;

  const finalPartUsageCapacity = Math.max(
    2.4,
    JOB_ORDER_PAGE_CAPACITY - closingBaseUnits,
  );
  const finalPartUsageStartIndex = findTrailingPartUsageStartIndex(
    partUsageRows.slice(firstPagePartUsageIndex),
    finalPartUsageCapacity,
  );
  const remainingPartUsageRows = partUsageRows.slice(firstPagePartUsageIndex);
  const overflowPartUsageRows = remainingPartUsageRows.slice(0, finalPartUsageStartIndex);
  const finalPartUsageRows = remainingPartUsageRows.slice(finalPartUsageStartIndex);

  const finalWorkCapacity = Math.max(
    0,
    JOB_ORDER_PAGE_CAPACITY -
      closingBaseUnits -
      estimatePartUsageRowsUnits(finalPartUsageRows),
  );

  while (
    workIndex < workRows.length &&
    estimateRemainingJobOrderWorkUnits(workRows, workIndex, activeGroup) > finalWorkCapacity
  ) {
    const nextPage = takeJobOrderWorkRowsForCapacity(
      workRows,
      workIndex,
      activeGroup,
      JOB_ORDER_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `job-order-page-${pageNumber++}`,
      workRows: nextPage.rows,
      partUsageRows: [],
      includeIntro: false,
      includeClosing: false,
    });
    workIndex = nextPage.nextIndex;
    activeGroup = nextPage.activeGroup;
  }

  let partUsageIndex = 0;

  while (
    partUsageIndex < overflowPartUsageRows.length &&
    estimateRemainingPartUsageUnits(overflowPartUsageRows, partUsageIndex) > 0
  ) {
    const partChunk = takePartUsageRowsForCapacity(
      overflowPartUsageRows,
      partUsageIndex,
      JOB_ORDER_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `job-order-page-${pageNumber++}`,
      workRows: [],
      partUsageRows: partChunk.rows,
      includeIntro: false,
      includeClosing: false,
    });
    partUsageIndex = partChunk.nextIndex;
  }

  pages.push({
    key: `job-order-page-${pageNumber}`,
    workRows: buildRemainingJobOrderWorkRows(workRows, workIndex, activeGroup),
    partUsageRows: finalPartUsageRows,
    includeIntro: false,
    includeClosing: true,
  });

  return pages;
}

function takeJobOrderWorkRowsForCapacity(
  rows: JobOrderWorkTableRow[],
  startIndex: number,
  activeGroup: JobOrderWorkGroupLabel | null,
  capacity: number,
) {
  const pageStartGroup = activeGroup;
  const pageRows: JobOrderWorkTableRow[] = [];
  let nextIndex = startIndex;
  let currentGroup = activeGroup;
  let units = 0;
  let insertedCarryover = false;

  if (currentGroup && rows[nextIndex]?.kind === "item") {
    const carryover = buildJobOrderCarryoverGroupRow(currentGroup, nextIndex);
    pageRows.push(carryover);
    units += estimateJobOrderWorkRowUnits(carryover);
    insertedCarryover = true;
  }

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimateJobOrderWorkRowUnits(row);

    if (pageRows.length > 0 && units + rowUnits > capacity) {
      break;
    }

    pageRows.push(row);
    units += rowUnits;
    nextIndex += 1;

    if (row.kind === "group") {
      currentGroup = row.label;
    }
  }

  while (pageRows.at(-1)?.kind === "group") {
    pageRows.pop();
    nextIndex -= 1;
    currentGroup = resolveJobOrderActiveGroup(pageRows, pageStartGroup);
  }

  if (
    pageRows.length === 0 ||
    (pageRows.length === 1 && insertedCarryover && pageRows[0]?.kind === "group")
  ) {
    pageRows.length = 0;

    if (currentGroup && rows[nextIndex]?.kind === "item") {
      pageRows.push(buildJobOrderCarryoverGroupRow(currentGroup, nextIndex));
    }

    const forcedRow = rows[nextIndex];

    if (forcedRow) {
      pageRows.push(forcedRow);
      nextIndex += 1;
      if (forcedRow.kind === "group") {
        currentGroup = forcedRow.label;
      }
    }
  }

  return {
    rows: pageRows,
    nextIndex,
    activeGroup: resolveJobOrderActiveGroup(pageRows, pageStartGroup),
  };
}

function buildRemainingJobOrderWorkRows(
  rows: JobOrderWorkTableRow[],
  startIndex: number,
  activeGroup: JobOrderWorkGroupLabel | null,
) {
  const remainingRows: JobOrderWorkTableRow[] = [];

  if (activeGroup && rows[startIndex]?.kind === "item") {
    remainingRows.push(buildJobOrderCarryoverGroupRow(activeGroup, startIndex));
  }

  return remainingRows.concat(rows.slice(startIndex));
}

function buildJobOrderCarryoverGroupRow(
  label: JobOrderWorkGroupLabel,
  rowIndex: number,
): JobOrderWorkTableRow {
  return {
    kind: "group",
    key: `continued-${label}-${rowIndex}`,
    label,
  };
}

function resolveJobOrderActiveGroup(
  rows: JobOrderWorkTableRow[],
  initialGroup: JobOrderWorkGroupLabel | null,
) {
  let currentGroup = initialGroup;

  for (const row of rows) {
    if (row.kind === "group") {
      currentGroup = row.label;
    }
  }

  return currentGroup;
}

function estimateRemainingJobOrderWorkUnits(
  rows: JobOrderWorkTableRow[],
  startIndex: number,
  activeGroup: JobOrderWorkGroupLabel | null,
) {
  return estimateJobOrderWorkRowsUnits(
    buildRemainingJobOrderWorkRows(rows, startIndex, activeGroup),
  );
}

function estimateJobOrderWorkRowsUnits(rows: JobOrderWorkTableRow[]) {
  return rows.reduce((sum, row) => sum + estimateJobOrderWorkRowUnits(row), 0);
}

function estimateJobOrderWorkRowUnits(row: JobOrderWorkTableRow) {
  if (row.kind === "group") {
    return 0.48;
  }

  let units = 0.9;

  if (row.item.description.length > 52) {
    units += 0.15;
  }

  if (row.item.description.length > 92) {
    units += 0.12;
  }

  if (row.item.isAdditional) {
    units += 0.08;
  }

  if (row.item.checklistCompleted && row.item.checklistCheckedAt) {
    units += 0.09;
  }

  return units;
}

function takePartUsageRowsForCapacity(
  rows: JobOrderPrintPartsUsageLine[],
  startIndex: number,
  capacity: number,
) {
  const pageRows: JobOrderPrintPartsUsageLine[] = [];
  let nextIndex = startIndex;
  let units = 0;

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimatePartUsageRowUnits(row);

    if (pageRows.length > 0 && units + rowUnits > capacity) {
      break;
    }

    pageRows.push(row);
    units += rowUnits;
    nextIndex += 1;
  }

  if (pageRows.length === 0 && rows[nextIndex]) {
    pageRows.push(rows[nextIndex]);
    nextIndex += 1;
  }

  return {
    rows: pageRows,
    nextIndex,
  };
}

function estimateRemainingPartUsageUnits(
  rows: JobOrderPrintPartsUsageLine[],
  startIndex: number,
) {
  return rows
    .slice(startIndex)
    .reduce((sum, row) => sum + estimatePartUsageRowUnits(row), 0);
}

function estimatePartUsageRowsUnits(rows: JobOrderPrintPartsUsageLine[]) {
  return rows.reduce((sum, row) => sum + estimatePartUsageRowUnits(row), 0);
}

function findTrailingPartUsageStartIndex(
  rows: JobOrderPrintPartsUsageLine[],
  capacity: number,
) {
  let units = 0;
  let index = rows.length;

  while (index > 0) {
    const row = rows[index - 1];
    const rowUnits = estimatePartUsageRowUnits(row);

    if (index < rows.length && units + rowUnits > capacity) {
      break;
    }

    units += rowUnits;
    index -= 1;
  }

  return index;
}

function estimatePartUsageRowUnits(row: JobOrderPrintPartsUsageLine) {
  let units = 0.66;

  if (row.description.length > 42) {
    units += 0.12;
  }

  return units;
}

function getJobOrderIntroUnits(optionalNarrativeCount: number) {
  const narrativeRows = optionalNarrativeCount > 0 ? Math.ceil(optionalNarrativeCount / 2) : 0;
  return 3.95 + narrativeRows * 0.86;
}

function buildOptionalNarrativeBlocks(jobOrder: JobOrderPrintDocument["jobOrder"]) {
  return [
    {
      title: "Customer Concern",
      value: normalizeOptionalPrintText(jobOrder.customerConcern),
    },
    {
      title: "Inspection Notes",
      value: normalizeOptionalPrintText(jobOrder.inspectionNotes),
    },
    {
      title: "Diagnosis",
      value: normalizeOptionalPrintText(jobOrder.diagnosis),
    },
    {
      title: "Work Performed",
      value: normalizeOptionalPrintText(jobOrder.workPerformed),
    },
  ].filter((block): block is { title: string; value: string } => block.value !== null);
}

function normalizeOptionalPrintText(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized || normalized === "-" || normalized === "—") {
    return null;
  }

  return normalized;
}

function formatVehicleModel(document: JobOrderPrintDocument["jobOrder"]) {
  if (document.vehicleMake && document.vehicleModel) {
    const yearPart = document.vehicleYear ? ` (${document.vehicleYear})` : "";
    return `${document.vehicleMake} ${document.vehicleModel}${yearPart}`;
  }

  return document.vehicleLabel;
}

function formatMileage(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("en-PH")} km`;
}

function optionalDate(value: string | null) {
  return value ? formatDateTime(value) : "—";
}
