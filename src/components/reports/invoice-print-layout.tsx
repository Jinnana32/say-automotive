import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import { ReportTotals } from "@/components/reports/report-totals";
import type {
  InvoiceItemDetail,
  InvoicePaymentEntry,
  InvoicePrintDocument,
} from "@/features/invoices/types";
import {
  formatInvoiceStatus,
  formatPaymentMethod,
} from "@/features/invoices/utils";
import {
  formatPrintCurrency,
  formatPrintCurrencyNumber,
} from "@/lib/currency";
import { formatDocumentDate, formatDateTime } from "@/lib/dates";

const INVOICE_PAGE_CAPACITY = 15;
const INVOICE_CONTINUATION_CAPACITY = 15.6;

type InvoicePrintPageModel = {
  key: string;
  itemRows: InvoiceItemDetail[];
  paymentRows: InvoicePaymentEntry[];
  includeIntro: boolean;
  includeClosing: boolean;
};

export function InvoicePrintLayout({
  document,
}: {
  document: InvoicePrintDocument;
}) {
  const { invoice, businessProfile } = document;
  const sourceLabel =
    invoice.jobOrderNumber ?? invoice.saleNumber ?? "Direct sale";
  const paidTotals = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const pages = buildInvoicePrintPages(invoice);

  return (
    <PrintPageStack className="leading-[1.35]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          className="leading-[1.35]"
          compactHeader={index > 0}
          businessProfile={businessProfile}
          documentTitle="Invoice"
          documentMeta={buildInvoiceHeaderMeta(
            invoice.invoiceNumber,
            invoice.invoiceDate,
            invoice.status,
          )}
        >
          {page.includeIntro ? (
            <>
              <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                <MetadataColumn
                  items={[
                    { label: "Invoice No.", value: invoice.invoiceNumber },
                    { label: "Client's Name", value: invoice.customerName },
                    {
                      label: "Contact Number",
                      value: invoice.customerContactNumber || "—",
                    },
                    {
                      label: "Plate Number",
                      value: invoice.vehiclePlateNumber || "—",
                    },
                  ]}
                />
                <MetadataColumn
                  items={[
                    { label: "Date", value: formatDocumentDate(invoice.invoiceDate) },
                    { label: "Status", value: formatInvoiceStatus(invoice.status) },
                    { label: "Address", value: invoice.customerAddress || "—" },
                    { label: "Car Model & Year", value: formatVehicleModel(invoice) },
                  ]}
                />
              </section>

              {invoice.status === "cancelled" ? (
                <section className="report-section-keep mt-4">
                  <div className="rounded-[1.25rem] border border-brand-red bg-brand-red/10 px-4 py-3">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-red">
                      Cancelled Invoice
                    </p>
                    <div className="mt-2 grid gap-2 text-[10.5px] text-slate-800 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold">Cancelled at:</span>{" "}
                        {invoice.cancelledAt
                          ? formatDateTime(invoice.cancelledAt)
                          : "Not recorded"}
                      </p>
                      <p>
                        <span className="font-semibold">Reason:</span>{" "}
                        {invoice.cancellationReason || "No reason recorded"}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="report-section-keep mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                <MetadataColumn
                  items={[
                    { label: "Source", value: sourceLabel },
                    { label: "Created", value: formatDateTime(invoice.createdAt) },
                    {
                      label: "Released",
                      value: invoice.releasedAt
                        ? formatDateTime(invoice.releasedAt)
                        : "—",
                    },
                  ]}
                />
                <MetadataColumn
                  items={[
                    { label: "Vehicle", value: invoice.vehicleLabel },
                    { label: "VIN", value: invoice.vehicleVin || "—" },
                    {
                      label: "Payment State",
                      value:
                        invoice.balance > 0
                          ? `Balance due ${formatPrintCurrency(invoice.balance)}`
                          : "Balance cleared",
                    },
                  ]}
                />
              </section>
            </>
          ) : null}

          {page.itemRows.length > 0 || page.includeIntro ? (
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
                    {page.itemRows.length > 0 ? (
                      page.itemRows.map((item) => (
                        <tr
                          key={item.id}
                          className="report-row-avoid border-t border-slate-200"
                        >
                          <td className="px-2 py-1.5 align-top">
                            {item.lineNumber}
                          </td>
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
          ) : null}

          {page.paymentRows.length > 0 || page.includeClosing ? (
            <section className="mt-4">
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
                    {page.paymentRows.length > 0 ? (
                      page.paymentRows.map((payment) => (
                        <tr
                          key={payment.id}
                          className="report-row-avoid border-t border-slate-200"
                        >
                          <td className="px-2 py-1.5 align-top">
                            {formatDocumentDate(payment.paidAt)}
                          </td>
                          <td className="px-2 py-1.5 align-top">
                            {formatPaymentMethod(payment.paymentMethod)}
                          </td>
                          <td className="px-2 py-1.5 align-top">
                            {payment.referenceNumber || "—"}
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
            </section>
          ) : null}

          {page.includeClosing ? (
            <section className="report-section-keep mt-4 grid gap-8 sm:grid-cols-[1fr_250px]">
              <div className="space-y-8">
                <ReportSignatureBlock
                  label="Prepared by:"
                  name={invoice.preparedByName || "Not captured"}
                  subtitle={invoice.preparedByTitle || "No title captured"}
                />
              </div>

              <div className="space-y-2">
                <ReportSectionHeading title="INVOICE SUMMARY" />
                <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-3">
                  <ReportTotals
                    lines={[
                      {
                        label: "Subtotal:",
                        value: formatPrintCurrency(invoice.subtotal),
                      },
                      {
                        label: "Discount:",
                        value: formatPrintCurrency(invoice.discount),
                      },
                      {
                        label: "Tax:",
                        value: formatPrintCurrency(invoice.tax),
                      },
                      {
                        label: "TOTAL:",
                        value: formatPrintCurrency(invoice.totalAmount),
                        emphasized: true,
                      },
                      { label: "Paid:", value: formatPrintCurrency(paidTotals) },
                      {
                        label: "Balance:",
                        value: formatPrintCurrency(invoice.balance),
                        emphasized: invoice.balance > 0,
                      },
                    ]}
                    className="justify-self-end"
                  />
                </div>
              </div>
            </section>
          ) : null}
        </PrintDocumentPage>
      ))}
    </PrintPageStack>
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

function buildInvoiceHeaderMeta(
  invoiceNumber: string,
  invoiceDate: string,
  status: InvoicePrintDocument["invoice"]["status"],
) {
  return `Invoice #: ${invoiceNumber} • Date: ${formatDocumentDate(invoiceDate)} • Status: ${formatInvoiceStatus(status)}`;
}

function buildInvoicePrintPages(invoice: InvoicePrintDocument["invoice"]): InvoicePrintPageModel[] {
  const introUnits = 6.2 + (invoice.status === "cancelled" ? 1.8 : 0);
  const closingUnits = 4.2;
  const totalItemUnits = estimateInvoiceItemUnits(invoice.items);
  const totalPaymentUnits = estimatePaymentUnits(invoice.payments);

  if (
    introUnits + totalItemUnits + totalPaymentUnits + closingUnits <= INVOICE_PAGE_CAPACITY
  ) {
    return [
      {
        key: "invoice-page-1",
        itemRows: invoice.items,
        paymentRows: invoice.payments,
        includeIntro: true,
        includeClosing: true,
      },
    ];
  }

  const finalPaymentsStartIndex = findTrailingPaymentStartIndex(
    invoice.payments,
    Math.max(2.2, INVOICE_PAGE_CAPACITY - closingUnits),
  );
  const overflowPayments = invoice.payments.slice(0, finalPaymentsStartIndex);
  const finalPayments = invoice.payments.slice(finalPaymentsStartIndex);
  const finalItemCapacity = Math.max(
    0,
    INVOICE_PAGE_CAPACITY - closingUnits - estimatePaymentUnits(finalPayments),
  );
  const pages: InvoicePrintPageModel[] = [];
  const firstItemChunk = takeInvoiceItemsForCapacity(
    invoice.items,
    0,
    Math.max(3.8, INVOICE_PAGE_CAPACITY - introUnits),
  );

  pages.push({
    key: "invoice-page-1",
    itemRows: firstItemChunk.rows,
    paymentRows: [],
    includeIntro: true,
    includeClosing: false,
  });

  let itemIndex = firstItemChunk.nextIndex;
  let pageNumber = 2;

  while (
    itemIndex < invoice.items.length &&
    estimateRemainingInvoiceItemUnits(invoice.items, itemIndex) > finalItemCapacity
  ) {
    const nextItems = takeInvoiceItemsForCapacity(
      invoice.items,
      itemIndex,
      INVOICE_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `invoice-page-${pageNumber++}`,
      itemRows: nextItems.rows,
      paymentRows: [],
      includeIntro: false,
      includeClosing: false,
    });
    itemIndex = nextItems.nextIndex;
  }

  let paymentIndex = 0;

  while (
    paymentIndex < overflowPayments.length &&
    estimateRemainingPaymentUnits(overflowPayments, paymentIndex) > 0
  ) {
    const paymentChunk = takePaymentsForCapacity(
      overflowPayments,
      paymentIndex,
      INVOICE_CONTINUATION_CAPACITY,
    );

    pages.push({
      key: `invoice-page-${pageNumber++}`,
      itemRows: [],
      paymentRows: paymentChunk.rows,
      includeIntro: false,
      includeClosing: false,
    });
    paymentIndex = paymentChunk.nextIndex;
  }

  pages.push({
    key: `invoice-page-${pageNumber}`,
    itemRows: invoice.items.slice(itemIndex),
    paymentRows: finalPayments,
    includeIntro: false,
    includeClosing: true,
  });

  return pages;
}

function takeInvoiceItemsForCapacity(
  rows: InvoiceItemDetail[],
  startIndex: number,
  capacity: number,
) {
  const pageRows: InvoiceItemDetail[] = [];
  let nextIndex = startIndex;
  let units = 0;

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimateInvoiceItemRowUnits(row);

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

function takePaymentsForCapacity(
  rows: InvoicePaymentEntry[],
  startIndex: number,
  capacity: number,
) {
  const pageRows: InvoicePaymentEntry[] = [];
  let nextIndex = startIndex;
  let units = 0;

  while (nextIndex < rows.length) {
    const row = rows[nextIndex];
    const rowUnits = estimatePaymentRowUnits(row);

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

function findTrailingPaymentStartIndex(
  rows: InvoicePaymentEntry[],
  capacity: number,
) {
  let units = 0;
  let index = rows.length;

  while (index > 0) {
    const row = rows[index - 1];
    const rowUnits = estimatePaymentRowUnits(row);

    if (index < rows.length && units + rowUnits > capacity) {
      break;
    }

    units += rowUnits;
    index -= 1;
  }

  return index;
}

function estimateRemainingInvoiceItemUnits(
  rows: InvoiceItemDetail[],
  startIndex: number,
) {
  return rows
    .slice(startIndex)
    .reduce((sum, row) => sum + estimateInvoiceItemRowUnits(row), 0);
}

function estimateInvoiceItemUnits(rows: InvoiceItemDetail[]) {
  return rows.reduce((sum, row) => sum + estimateInvoiceItemRowUnits(row), 0);
}

function estimateInvoiceItemRowUnits(row: InvoiceItemDetail) {
  let units = 1.3;

  if (row.description.length > 54) {
    units += 0.25;
  }

  if (row.description.length > 94) {
    units += 0.25;
  }

  return units;
}

function estimateRemainingPaymentUnits(
  rows: InvoicePaymentEntry[],
  startIndex: number,
) {
  return rows
    .slice(startIndex)
    .reduce((sum, row) => sum + estimatePaymentRowUnits(row), 0);
}

function estimatePaymentUnits(rows: InvoicePaymentEntry[]) {
  return rows.reduce((sum, row) => sum + estimatePaymentRowUnits(row), 0);
}

function estimatePaymentRowUnits(row: InvoicePaymentEntry) {
  let units = 0.95;

  if ((row.referenceNumber ?? "").length > 18) {
    units += 0.15;
  }

  return units;
}

function formatVehicleModel(invoice: InvoicePrintDocument["invoice"]) {
  if (invoice.vehicleMake && invoice.vehicleModel) {
    const yearPart = invoice.vehicleYear ? ` (${invoice.vehicleYear})` : "";
    return `${invoice.vehicleMake} ${invoice.vehicleModel}${yearPart}`;
  }

  return invoice.vehicleLabel;
}

function formatQuantity(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
