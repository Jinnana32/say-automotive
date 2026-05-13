import { ReportFooter } from "@/components/reports/report-footer";
import { ReportHeader } from "@/components/reports/report-header";
import type { ReportsPrintDocument } from "@/features/reports/types";
import { formatPrintCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export function ReportsPrintLayout({
  document,
}: {
  document: ReportsPrintDocument;
}) {
  const { reports, businessProfile, generatedAt } = document;
  const activeTrendRows = reports.revenueTrend.filter(
    (point) => point.paymentsCollected > 0 || point.vehiclesReleased > 0,
  );
  const omittedTrendBucketCount = reports.revenueTrend.length - activeTrendRows.length;
  const statusRows: Array<[string, string, string]> = [
    ...reports.quotationStatusBreakdown.map(
      (item): [string, string, string] => ["Quotations", item.label, String(item.count)],
    ),
    ...reports.periodJobOrderStatusBreakdown.map(
      (item): [string, string, string] => ["Job Orders (period)", item.label, String(item.count)],
    ),
    ...reports.liveJobOrderStatusBreakdown.map(
      (item): [string, string, string] => ["Job Orders (live)", item.label, String(item.count)],
    ),
  ];
  const stockMovementRows = reports.recentStockMovements.slice(0, 8);
  const omittedStockMovementCount = Math.max(0, reports.recentStockMovements.length - stockMovementRows.length);

  return (
    <article className="flex min-h-[297mm] flex-col bg-white px-[12mm] py-[10mm] text-[11px] leading-[1.35] text-slate-900">
      <ReportHeader
        businessName={businessProfile.businessName}
        documentTitle="Business Reports"
        eyebrow="SAY Automotive - Reports"
      />

      <section className="report-section-keep mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <MetadataColumn
          items={[
            { label: "Preset", value: reports.filters.preset.replaceAll("-", " ") },
            { label: "Period", value: reports.filters.periodLabel },
          ]}
        />
        <MetadataColumn
          items={[
            { label: "Trend Grouping", value: reports.filters.groupBy },
            { label: "Generated", value: formatDateTime(generatedAt) },
          ]}
        />
      </section>

      <section className="report-section-keep mt-4">
        <SectionHeading
          title="Period Performance"
          description="These metrics are affected by the selected report window."
        />
        <div className="mt-2 overflow-hidden border border-slate-300">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold">Metric</th>
                <th className="px-2 py-1.5 text-left font-semibold">Supporting Note</th>
                <th className="w-28 px-2 py-1.5 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {reports.periodPerformanceMetrics.map((metric) => (
                <tr key={metric.label} className="report-row-avoid border-t border-slate-200">
                  <td className="px-2 py-1.5 align-top font-semibold">{metric.label}</td>
                  <td className="px-2 py-1.5 align-top">{metric.helper || "—"}</td>
                  <td className="px-2 py-1.5 text-right align-top">{formatMetricValue(metric)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section-keep mt-4 grid gap-5 sm:grid-cols-2">
        <TableSection
          title="Revenue and Service Trend"
          description="Grouped summary of collected payments and released vehicles."
          columns={["Bucket", "Payments", "Released"]}
          rows={
            activeTrendRows.map(
              (point): [string, string, string] => [
                point.label,
                formatPrintCurrency(point.paymentsCollected),
                String(point.vehiclesReleased),
              ],
            )
          }
          emptyMessage="No payment or vehicle release activity recorded in this period."
          footerNote={
            omittedTrendBucketCount > 0
              ? "Empty trend buckets were omitted for readability."
              : undefined
          }
        />
        <TableSection
          title="Workflow Funnel"
          description="Operational movement from quotations through paid billing."
          columns={["Stage", "Count", "Helper"]}
          rows={reports.workflowFunnel.map(
            (step): [string, string, string] => [step.label, String(step.count), step.helper || "—"],
          )}
        />
      </section>

      <section className="report-section-keep mt-4 grid gap-5 sm:grid-cols-2">
        <TableSection
          title="Top Services"
          description="Highest-value service and labor lines in the selected period."
          columns={["Description", "Qty", "Amount"]}
          rows={
            reports.topServices.map(
              (item): [string, string, string] => [
                item.label,
                formatQuantity(item.quantity),
                formatPrintCurrency(item.amount),
              ],
            )
          }
          emptyMessage="No billed services recorded in this period."
        />
        <TableSection
          title="Top Products and Parts"
          description="Combined service-billed products and completed POS movement."
          columns={["Description", "Qty", "Amount"]}
          rows={
            reports.topProducts.map(
              (item): [string, string, string] => [
                item.label,
                formatQuantity(item.quantity),
                formatPrintCurrency(item.amount),
              ],
            )
          }
          emptyMessage="No billed products or parts recorded in this period."
        />
      </section>

      <section className="report-section-keep mt-4 grid gap-5 sm:grid-cols-2">
        <TableSection
          title="Operational Alerts"
          description="These metrics are live and not controlled by the selected period."
          columns={["Metric", "Note", "Value"]}
          rows={reports.operationalAlerts.map(
            (metric): [string, string, string] => [
              metric.label,
              metric.helper || "—",
              formatMetricValue(metric),
            ],
          )}
        />
        <TableSection
          title="Payment Method Mix"
          description="Collected payment mix within the selected period."
          columns={["Method", "Transactions", "Amount"]}
          rows={
            reports.paymentMethodBreakdown.map(
              (item): [string, string, string] => [
                item.label,
                String(item.count),
                formatPrintCurrency(item.amount),
              ],
            )
          }
          emptyMessage="No collected payments recorded in the selected period."
        />
      </section>

      <section className="report-section-keep mt-4 grid gap-5 sm:grid-cols-2">
        <TableSection
          title="Status Breakdowns"
          description="Quotation and job-order distribution in the selected period and live queue."
          columns={["Bucket", "Status", "Count"]}
          rows={statusRows}
          emptyMessage="No quotation or job-order statuses were recorded for this view."
        />
        <TableSection
          title="Unpaid Invoices"
          description="Current receivables that still need collection follow-up."
          columns={["Invoice", "Customer", "Balance"]}
          rows={
            reports.unpaidInvoices.map(
              (invoice): [string, string, string] => [
                invoice.invoiceNumber,
                invoice.customerName,
                formatPrintCurrency(invoice.balance),
              ],
            )
          }
          emptyMessage="No unpaid invoices at the moment."
        />
      </section>

      <section className="report-section-keep mt-4">
        <SectionHeading
          title="Recent Stock Movements"
          description="Most recent inventory movement entries included for operations context."
        />
        <div className="mt-2 overflow-hidden border border-slate-300">
          {stockMovementRows.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">No stock movements recorded yet.</p>
          ) : (
            <table className="w-full border-collapse text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold">Product</th>
                  <th className="w-28 px-2 py-1.5 text-left font-semibold">Movement</th>
                  <th className="w-20 px-2 py-1.5 text-right font-semibold">Quantity</th>
                  <th className="w-32 px-2 py-1.5 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {stockMovementRows.map((movement) => (
                  <tr key={movement.id} className="report-row-avoid border-t border-slate-200">
                    <td className="px-2 py-1.5 align-top">{movement.productName}</td>
                    <td className="px-2 py-1.5 align-top">{movement.movementType.replaceAll("_", " ")}</td>
                    <td className="px-2 py-1.5 text-right align-top">{formatQuantity(movement.quantity)}</td>
                    <td className="px-2 py-1.5 align-top">{formatDateTime(movement.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {omittedStockMovementCount > 0 ? (
          <p className="mt-2 text-[10px] text-slate-600">
            Showing the 8 most recent stock movements for print readability.
          </p>
        ) : null}
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

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-display text-[18px] font-semibold uppercase text-slate-950">{title}</h2>
      <p className="mt-1 text-[10px] text-slate-600">{description}</p>
    </div>
  );
}

function TableSection({
  title,
  description,
  columns,
  rows,
  emptyMessage,
  footerNote,
}: {
  title: string;
  description: string;
  columns: [string, string, string];
  rows: Array<[string, string, string]>;
  emptyMessage?: string;
  footerNote?: string;
}) {
  return (
    <div>
      <SectionHeading title={title} description={description} />
      <div className="mt-2 overflow-hidden border border-slate-300">
        {rows.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500">{emptyMessage ?? "No data available."}</p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column}
                    className={`px-2 py-1.5 font-semibold ${index === 2 ? "text-right" : "text-left"}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="report-row-avoid border-t border-slate-200">
                  <td className="px-2 py-1.5 align-top">{row[0]}</td>
                  <td className="px-2 py-1.5 align-top">{row[1]}</td>
                  <td className="px-2 py-1.5 text-right align-top">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {footerNote ? <p className="mt-2 text-[10px] text-slate-600">{footerNote}</p> : null}
    </div>
  );
}

function formatMetricValue(metric: ReportsPrintDocument["reports"]["periodPerformanceMetrics"][number]) {
  if (metric.kind === "currency") {
    return formatPrintCurrency(metric.value);
  }

  return formatQuantity(metric.value);
}

function formatQuantity(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
