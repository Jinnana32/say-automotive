import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { buildQuotationPrintBreakdown } from "@/features/quotations/report-utils";
import type {
  QuotationItemDetail,
  QuotationPrintDocument,
  QuotationPrintMode,
} from "@/features/quotations/types";
import {
  formatPrintCurrency,
  formatPrintCurrencyNumber,
} from "@/lib/currency";
import { formatDocumentDate } from "@/lib/dates";

export function QuotationPrintLayout({
  document,
  mode = "full",
}: {
  document: QuotationPrintDocument;
  mode?: QuotationPrintMode;
}) {
  const {
    quotation,
    businessProfile,
    customerSnapshot,
    vehicleSnapshot,
    validUntil,
  } = document;
  const breakdown = buildQuotationPrintBreakdown(quotation, mode);
  const lineItems = buildQuotationLineRows(quotation.items, mode);
  const natureOfRepair = getPrintableText(quotation.natureOfRepair);
  const serviceAdviserName =
    quotation.preparedByName?.trim() || "Prepared by current user";
  const serviceAdviserTitle = getPrintableText(quotation.preparedByTitle);
  const pages = buildQuotationPrintPages({
    lineItems,
    mode,
    hasNatureOfRepair: Boolean(natureOfRepair),
  });

  return (
    <PrintPageStack className="quotation-print-document leading-[1.42]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          className="leading-[1.42]"
          bodyClassName="pb-[9mm]"
          compactHeader={index > 0}
          businessProfile={businessProfile}
          documentTitle={getDocumentTitle(mode)}
          documentMeta={buildCompactHeaderMeta(
            quotation.quotationNumber,
            quotation.createdAt,
          )}
        >
          {page.includeIntro ? (
            <>
              <section className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <QuotationInfoPanel
                  title="CUSTOMER DETAILS"
                  rows={[
                    { label: "Name", value: quotation.customerName },
                    { label: "Company", value: customerSnapshot.companyName || "—" },
                    {
                      label: "Phone",
                      value: quotation.customerContactNumber || "—",
                    },
                    { label: "Email", value: customerSnapshot.email || "—" },
                    { label: "Address", value: quotation.customerAddress || "—" },
                  ]}
                />
                <QuotationInfoPanel
                  title="VEHICLE INFORMATION"
                  rows={[
                    { label: "Make / Model", value: formatVehicleModel(quotation) },
                    {
                      label: "Year",
                      value: quotation.vehicleYear
                        ? String(quotation.vehicleYear)
                        : "—",
                    },
                    { label: "Color", value: vehicleSnapshot.color || "—" },
                    { label: "VIN", value: quotation.vehicleVin || "—" },
                    { label: "Mileage", value: formatMileage(vehicleSnapshot.mileage) },
                    { label: "Plate No.", value: quotation.vehiclePlateNumber || "—" },
                  ]}
                />
              </section>

              {page.includeNatureOfRepair && natureOfRepair ? (
                <section className="report-section-keep mt-3.5">
                  <div className="border border-brand-border">
                    <div className="bg-brand-navy px-4 py-2 text-[10.25px] font-semibold tracking-[0.22em] text-white">
                      NATURE OF REPAIR
                    </div>
                    <div className="px-4 py-3 text-[10.75px] leading-[1.42] text-slate-800">
                      {natureOfRepair}
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {page.lineRows.length > 0 ? (
            <QuotationLineItemsSection rows={page.lineRows} mode={mode} />
          ) : null}

          {page.includeClosing ? (
            <div className="flex flex-col gap-3 pt-3.5">
              <section className="report-section-keep grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_268px]">
                <QuotationTermsSection terms={buildDefaultQuotationTerms(validUntil)} />
                <QuotationTotalsPanel breakdown={breakdown} />
              </section>

              <section className="report-section-keep">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
                  APPROVAL
                </p>
                <div className="mt-1.5 h-0.5 w-12 bg-brand-red" />
                <div className="grid items-start gap-x-4 gap-y-2 pt-[7px] sm:grid-cols-[1.1fr_1.2fr_0.9fr]">
                  <div className="text-[10.1px] leading-[1.34] text-slate-700">
                    <p>
                      I have read and agree to the terms and conditions stated above and
                      authorize SAY Auto Care to proceed with the listed services.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <SignatureLine label="Customer Signature" />
                    <SignatureLine label="Name" value={quotation.customerName} />
                    <SignatureLine label="Date" />
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0">
                    <PreparedBySignatureBlock
                      name={serviceAdviserName}
                      title={serviceAdviserTitle}
                      businessName={businessProfile.businessName}
                    />
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </PrintDocumentPage>
      ))}
    </PrintPageStack>
  );
}

function QuotationLineItemsSection({
  rows,
  mode,
}: {
  rows: QuotationLineRow[];
  mode: QuotationPrintMode;
}) {
  return (
    <section className="mt-3.5">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="bg-brand-navy px-3 py-[5px] text-[10.25px] font-semibold tracking-[0.22em] text-white">
          {getLineItemHeading(mode)}
        </span>
        <span className="h-[2px] flex-1 bg-brand-border" />
      </div>
      <div className="overflow-hidden border border-brand-border">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="w-10 px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">
                Description
              </th>
              <th className="w-20 px-3 py-2 text-left font-semibold">
                Qty
              </th>
              <th className="w-28 px-3 py-2 text-right font-semibold">
                Unit Price
              </th>
              <th className="w-28 px-3 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "group" ? (
                <tr
                  key={row.key}
                  className="border-t border-slate-200 bg-slate-50"
                >
                  <td
                    colSpan={5}
                    className="border-t border-slate-200 px-3 py-[5px] text-[9.75px] font-semibold uppercase tracking-[0.22em] text-brand-navy"
                  >
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr
                  key={row.key}
                  className="report-row-avoid border-t border-slate-200"
                >
                  <td className="px-3 py-2.5 align-top text-slate-700">
                    {row.displayLineNumber}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-semibold leading-[1.3] text-slate-950">
                      {row.description}
                    </p>
                    {row.subtext ? (
                      <p className="mt-0.5 text-[9.25px] leading-[1.25] text-slate-600">
                        {row.subtext}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-700">
                    {row.quantityLabel}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top text-slate-800">
                    {formatPrintCurrencyNumber(row.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top font-semibold text-slate-950">
                    {formatPrintCurrencyNumber(row.amount)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
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
      <div className="flex items-center gap-2.5">
        <span className="bg-brand-navy px-3 py-[5px] text-[10.25px] font-semibold tracking-[0.22em] text-white">
          {title}
        </span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>
      <div className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 text-[10.5px]"
          >
            <p className="font-semibold text-slate-800">{row.label}</p>
            <p className="min-w-0 break-words text-slate-900">
              {row.value || "—"}
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
      <div className="mt-1.5 h-px bg-brand-border" />
      <ul className="mt-[5px] list-disc space-y-[2px] pl-4 text-[9.95px] leading-[1.28] text-slate-700">
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
  const totalLines =
    breakdown.mode === "full"
      ? [
          {
            label: "Total Parts",
            value: formatPrintCurrency(breakdown.totalParts),
          },
          {
            label: "Total Labor",
            value: formatPrintCurrency(breakdown.totalLabor),
          },
          {
            label: "Subtotal",
            value: formatPrintCurrency(breakdown.subtotal),
          },
          ...(breakdown.discount > 0
            ? [
                {
                  label: "Discount",
                  value: formatPrintCurrency(breakdown.discount),
                },
              ]
            : []),
          ...(breakdown.tax > 0
            ? [
                {
                  label: "Tax / VAT",
                  value: formatPrintCurrency(breakdown.tax),
                },
              ]
            : []),
        ]
      : [
          {
            label:
              breakdown.mode === "parts"
                ? "Parts Total"
                : "Labor / Services Total",
            value: formatPrintCurrency(breakdown.visibleSubtotal),
          },
        ];

  return (
    <section className="flex h-full flex-col justify-between overflow-hidden border border-brand-border bg-brand-soft/35">
      <div className="flex-1 px-3.5 pt-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-brand-navy">
          {breakdown.mode === "full"
            ? "QUOTATION SUMMARY"
            : "PRINT MODE SUMMARY"}
        </p>
        <div className="mt-1.5 h-px bg-brand-border" />
        <table className="mt-2 w-full border-collapse text-[10.6px]">
          <tbody>
            {totalLines.map((line) => (
              <tr
                key={line.label}
                className="border-b border-slate-200 last:border-b-0"
              >
                <td className="py-1 pr-4 font-semibold text-slate-700">
                  {line.label}
                </td>
                <td className="py-1 text-right font-semibold text-slate-900">
                  {line.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t-2 border-brand-red bg-brand-navy px-3.5 py-2.25 text-white">
        <div className="flex items-end justify-between gap-4">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em]">
            {getTotalsFooterLabel(breakdown.mode)}
          </span>
          <span className="text-[20px] font-semibold leading-none">
            {formatPrintCurrency(breakdown.visibleTotal)}
          </span>
        </div>
      </div>
    </section>
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
    <div className="grid grid-cols-[118px_minmax(0,150px)] items-center gap-2">
      <p className="text-[10.25px] font-semibold text-slate-700">{label}:</p>
      <div className="border-b border-slate-500 pb-px text-[10.75px] leading-tight text-slate-950">
        {value?.trim() || "\u00A0"}
      </div>
    </div>
  );
}

function PreparedBySignatureBlock({
  name,
  title,
  businessName,
}: {
  name: string;
  title: string | null;
  businessName: string;
}) {
  const subtitle = title || businessName;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10.25px] font-semibold text-slate-700">
        Prepared By:
      </p>
      <div className="w-[150px] border-b border-slate-500 pb-px text-[10.75px] leading-tight text-slate-950">
        {"\u00A0"}
      </div>
      <p className="text-[10.75px] leading-tight text-slate-950">{name}</p>
      <p className="text-[10.25px] leading-tight text-slate-600">{subtitle}</p>
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
  | { kind: "group"; key: string; label: "PARTS" | "LABOR / SERVICES" }
  | {
      kind: "item";
      key: string;
      displayLineNumber: number;
      description: string;
      subtext: string | null;
      quantityLabel: string;
      unitPrice: number;
      amount: number;
    };

type QuotationPrintPageModel = {
  key: string;
  lineRows: QuotationLineRow[];
  includeIntro: boolean;
  includeNatureOfRepair: boolean;
  includeClosing: boolean;
};

function buildQuotationPrintPages(params: {
  lineItems: QuotationLineRow[];
  mode: QuotationPrintMode;
  hasNatureOfRepair: boolean;
}): QuotationPrintPageModel[] {
  const { lineItems, mode, hasNatureOfRepair } = params;
  const pageCapacity = getQuotationPageCapacity(mode);
  const introUnits = getQuotationIntroUnits(hasNatureOfRepair);
  const closingUnits = getQuotationClosingUnits(mode);
  const totalUnits = estimateLineRowsUnits(lineItems);

  if (introUnits + totalUnits + closingUnits <= pageCapacity) {
    return [
      {
        key: "quotation-page-1",
        lineRows: lineItems,
        includeIntro: true,
        includeNatureOfRepair: hasNatureOfRepair,
        includeClosing: true,
      },
    ];
  }

  const pages: QuotationPrintPageModel[] = [];
  const firstPage = takeRowsForCapacity(
    lineItems,
    0,
    null,
    Math.max(3.5, pageCapacity - introUnits),
  );
  pages.push({
    key: "quotation-page-1",
    lineRows: firstPage.rows,
    includeIntro: true,
    includeNatureOfRepair: hasNatureOfRepair,
    includeClosing: false,
  });

  let index = firstPage.nextIndex;
  let activeGroup = firstPage.activeGroup;
  let pageNumber = 2;
  const finalPageCapacity = Math.max(3.5, pageCapacity - closingUnits);

  while (
    index < lineItems.length &&
    estimateRemainingLineUnits(lineItems, index, activeGroup) > finalPageCapacity
  ) {
    const nextPage = takeRowsForCapacity(
      lineItems,
      index,
      activeGroup,
      pageCapacity,
    );

    pages.push({
      key: `quotation-page-${pageNumber++}`,
      lineRows: nextPage.rows,
      includeIntro: false,
      includeNatureOfRepair: false,
      includeClosing: false,
    });
    index = nextPage.nextIndex;
    activeGroup = nextPage.activeGroup;
  }

  pages.push({
    key: `quotation-page-${pageNumber}`,
    lineRows: buildRemainingRowsForFinalPage(lineItems, index, activeGroup),
    includeIntro: false,
    includeNatureOfRepair: false,
    includeClosing: true,
  });

  return pages;
}

function takeRowsForCapacity(
  rows: QuotationLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
  capacity: number,
) {
  const pageStartGroup = activeGroup;
  const pageRows: QuotationLineRow[] = [];
  let nextIndex = startIndex;
  let currentGroup = activeGroup;
  let units = 0;
  let insertedCarryover = false;

  if (currentGroup && rows[nextIndex]?.kind === "item") {
    const carryover = buildCarryoverGroupRow(currentGroup, nextIndex);
    pageRows.push(carryover);
    units += estimateLineRowUnits(carryover);
    insertedCarryover = true;
  }

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimateLineRowUnits(row);

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
    currentGroup = resolveActiveGroup(pageRows, pageStartGroup);
  }

  if (
    pageRows.length === 0 ||
    (pageRows.length === 1 && insertedCarryover && pageRows[0]?.kind === "group")
  ) {
    pageRows.length = 0;

    if (currentGroup && rows[nextIndex]?.kind === "item") {
      pageRows.push(buildCarryoverGroupRow(currentGroup, nextIndex));
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
    activeGroup: resolveActiveGroup(pageRows, pageStartGroup),
  };
}

function buildRemainingRowsForFinalPage(
  rows: QuotationLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  const remainingRows: QuotationLineRow[] = [];

  if (activeGroup && rows[startIndex]?.kind === "item") {
    remainingRows.push(buildCarryoverGroupRow(activeGroup, startIndex));
  }

  return remainingRows.concat(rows.slice(startIndex));
}

function buildCarryoverGroupRow(
  label: "PARTS" | "LABOR / SERVICES",
  rowIndex: number,
): QuotationLineRow {
  return {
    kind: "group",
    key: `continued-${label}-${rowIndex}`,
    label,
  };
}

function resolveActiveGroup(
  rows: QuotationLineRow[],
  initialGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  let currentGroup = initialGroup;

  for (const row of rows) {
    if (row.kind === "group") {
      currentGroup = row.label;
    }
  }

  return currentGroup;
}

function estimateRemainingLineUnits(
  rows: QuotationLineRow[],
  startIndex: number,
  activeGroup: "PARTS" | "LABOR / SERVICES" | null,
) {
  return estimateLineRowsUnits(
    buildRemainingRowsForFinalPage(rows, startIndex, activeGroup),
  );
}

function estimateLineRowsUnits(rows: QuotationLineRow[]) {
  return rows.reduce((sum, row) => sum + estimateLineRowUnits(row), 0);
}

function estimateLineRowUnits(row: QuotationLineRow) {
  if (row.kind === "group") {
    return 0.65;
  }

  let units = 1.12;

  if (row.subtext) {
    units += 0.18;
  }

  if (row.description.length > 52) {
    units += 0.22;
  }

  if (row.description.length > 92) {
    units += 0.18;
  }

  return units;
}

function getQuotationPageCapacity(mode: QuotationPrintMode) {
  switch (mode) {
    case "parts":
      return 18.1;
    case "labor":
      return 17.8;
    default:
      return 17.65;
  }
}

function getQuotationIntroUnits(hasNatureOfRepair: boolean) {
  return hasNatureOfRepair ? 5.1 : 4.25;
}

function getQuotationClosingUnits(mode: QuotationPrintMode) {
  switch (mode) {
    case "parts":
    case "labor":
      return 4.4;
    default:
      return 4.95;
  }
}

function buildQuotationLineRows(
  items: QuotationItemDetail[],
  mode: QuotationPrintMode,
): QuotationLineRow[] {
  const showParts = mode !== "labor";
  const showLabor = mode !== "parts";
  const partItems = showParts
    ? items.filter((item) => item.itemType === "product")
    : [];
  const laborItems = showLabor
    ? items.filter(
        (item) => item.itemType === "service" || item.itemType === "labor",
      )
    : [];

  const rows: QuotationLineRow[] = [];
  let displayLineNumber = 1;

  if (partItems.length > 0) {
    rows.push({ kind: "group", key: "parts-group", label: "PARTS" });
    rows.push(
      ...partItems.map((item) => ({
        kind: "item" as const,
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
    rows.push({
      kind: "group",
      key: "labor-group",
      label: "LABOR / SERVICES",
    });
    rows.push(
      ...laborItems.map((item) => ({
        kind: "item" as const,
        key: item.id,
        displayLineNumber: displayLineNumber++,
        description: item.description,
        subtext: item.itemType === "service" ? "Service" : "Labor",
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
    : "This quotation is valid until the date stated above.";

  return [
    validityText,
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

function formatMileage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-PH").format(value)} km`;
}

function getPrintableText(value: string | null) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "—" || trimmed === "-") {
    return null;
  }

  return trimmed;
}

function getDocumentTitle(mode: QuotationPrintMode) {
  switch (mode) {
    case "parts":
      return "Parts Quotation";
    case "labor":
      return "Labor & Services Quotation";
    default:
      return "Quotation";
  }
}

function getLineItemHeading(mode: QuotationPrintMode) {
  switch (mode) {
    case "parts":
      return "PARTS QUOTATION";
    case "labor":
      return "LABOR & SERVICES";
    default:
      return "QUOTED ITEMS";
  }
}

function getTotalsFooterLabel(mode: QuotationPrintMode) {
  switch (mode) {
    case "parts":
      return "TOTAL PARTS";
    case "labor":
      return "TOTAL LABOR & SERVICES";
    default:
      return "TOTAL QUOTATION";
  }
}
