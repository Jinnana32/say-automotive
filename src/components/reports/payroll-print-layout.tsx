import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportSignatureBlock } from "@/components/reports/report-signature-block";
import { ReportTotals } from "@/components/reports/report-totals";
import type { PayrollPeriodItemSummary, PayrollPrintDocument } from "@/features/payroll/types";
import {
  formatPayBasisLabel,
  formatPayrollCoverage,
  formatPayrollPeriodStatusLabel,
  formatPayrollWarningLabel,
  formatWorkedDuration,
} from "@/features/payroll/utils";
import { formatPrintCurrency, formatPrintCurrencyNumber } from "@/lib/currency";
import { formatDateTime, formatDocumentDate } from "@/lib/dates";

const FIRST_PAGE_ROW_COUNT = 9;
const FOLLOWING_PAGE_ROW_COUNT = 12;

export function PayrollPrintLayout({
  document,
}: {
  document: PayrollPrintDocument;
}) {
  const { period, summary, settings, items, businessProfile, generatedAt } = document;
  const pages = buildPayrollPages(items);

  return (
    <PrintPageStack className="leading-[1.35]">
      {pages.map((page, index) => (
        <PrintDocumentPage
          key={page.key}
          businessProfile={businessProfile}
          documentTitle="Payroll Summary"
          documentMeta={buildDocumentMeta(period, index + 1, pages.length)}
          compactHeader={index > 0}
          className="leading-[1.35]"
          bodyClassName="pb-[8mm]"
        >
          {page.includeOverview ? (
            <section className="report-section-keep mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.35fr)_250px]">
              <div className="space-y-3">
                <div>
                  <ReportSectionHeading title="PAYROLL PERIOD" />
                  <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2">
                    <MetadataRow label="Label" value={period.label} />
                    <MetadataRow label="Status" value={formatPayrollPeriodStatusLabel(period.status)} />
                    <MetadataRow
                      label="Coverage"
                      value={formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                    />
                    <MetadataRow label="Payout date" value={formatDocumentDate(period.payoutDate)} />
                    <MetadataRow label="Generated" value={formatDateTime(generatedAt)} />
                    <MetadataRow
                      label="Payroll rule"
                      value={`${settings.standardDailyHours}h day · ${(settings.holidayPremiumRate * 100).toFixed(2)}% holiday premium`}
                    />
                  </div>
                </div>

                <div>
                  <ReportSectionHeading title="CUT NOTES" />
                  <div className="rounded-sm border border-brand-border bg-brand-soft/20 px-3 py-2 text-[10.5px] text-slate-700">
                    <p>
                      Late days still count as paid days, with deductions based on missed time.
                      Half days count as 0.5 paid day, and holiday premium applies only when the
                      employee actually worked on the holiday date.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <ReportSectionHeading title="PAYROLL TOTALS" />
                <div className="rounded-sm border border-brand-border bg-brand-soft/30 px-3 py-3">
                  <ReportTotals
                    lines={[
                      { label: "Base pay:", value: formatPrintCurrency(summary.totalBasePay) },
                      { label: "Late deductions:", value: formatPrintCurrency(summary.totalLateDeductions) },
                      { label: "Holiday premium:", value: formatPrintCurrency(summary.totalHolidayPremiumPay) },
                      { label: "Overtime:", value: formatPrintCurrency(summary.totalOvertimePay) },
                      { label: "Allowances:", value: formatPrintCurrency(summary.totalAllowancePay) },
                      { label: "Gross payout:", value: formatPrintCurrency(summary.totalGrossPay) },
                      { label: "Net payout:", value: formatPrintCurrency(summary.totalNetPay), emphasized: true },
                    ]}
                    className="max-w-none"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-4">
            <ReportSectionHeading title={page.includeOverview ? "PAYROLL ROWS" : "PAYROLL ROWS CONTINUED"} />
            <div className="overflow-hidden border border-brand-border">
              <table className="w-full border-collapse text-[10px]">
                <thead className="bg-brand-navy text-white">
                  <tr>
                    <th className="w-[19%] px-2.5 py-2 text-left font-semibold">Staff member</th>
                    <th className="w-[16%] px-2.5 py-2 text-left font-semibold">Activity</th>
                    <th className="w-[15%] px-2.5 py-2 text-right font-semibold">Base / day rate</th>
                    <th className="w-[15%] px-2.5 py-2 text-right font-semibold">Holiday + OT</th>
                    <th className="w-[16%] px-2.5 py-2 text-right font-semibold">Adjustments</th>
                    <th className="w-[11%] px-2.5 py-2 text-right font-semibold">Net pay</th>
                    <th className="w-[8%] px-2.5 py-2 text-left font-semibold">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((item) => (
                    <PayrollRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {page.includeClosing ? (
            <section className="report-section-keep mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_290px]">
              <div className="space-y-3">
                <div>
                  <ReportSectionHeading title="PAYROLL REVIEW" />
                  <div className="rounded-sm border border-brand-border bg-white px-3 py-2 text-[10.5px] text-slate-700">
                    <p>
                      Warning rows should be reviewed before release. Manual additions and
                      deductions shown here are already included in the net payout.
                    </p>
                    <p className="mt-2">
                      Staff in cut: {summary.totalStaffCount} · Warning rows: {summary.warningStaffCount}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ReportSignatureBlock label="Prepared by" />
                  <ReportSignatureBlock label="Approved by" />
                </div>
              </div>

              <div className="space-y-2">
                <ReportSectionHeading title="FINAL PAYOUT" />
                <div className="rounded-sm border border-brand-border bg-brand-soft/25 px-3 py-3">
                  <ReportTotals
                    lines={[
                      { label: "Worked hours:", value: formatWorkedDuration(summary.totalWorkedMinutes) },
                      { label: "Missing attendance:", value: String(summary.missingAttendanceCount) },
                      { label: "Open shifts:", value: String(summary.openShiftCount) },
                      { label: "Pending approval:", value: String(summary.pendingApprovalCount) },
                      { label: "Total net payout:", value: formatPrintCurrency(summary.totalNetPay), emphasized: true },
                    ]}
                    className="max-w-none"
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

function PayrollRow({ item }: { item: PayrollPeriodItemSummary }) {
  const warningSummary =
    item.warningCodes.length > 0
      ? item.warningCodes.map((warningCode) => formatPayrollWarningLabel(warningCode)).join(", ")
      : null;

  return (
    <tr className="report-row-avoid border-t border-slate-200 align-top">
      <td className="px-2.5 py-2.5">
        <p className="font-semibold text-slate-950">{item.fullName}</p>
        <p className="text-slate-600 capitalize">{item.role.replaceAll("_", " ")}</p>
        <p className="text-slate-600">
          {item.payBasis ? formatPayBasisLabel(item.payBasis) : "Not configured"}
        </p>
        {warningSummary ? <p className="mt-1 text-[9.5px] text-brand-red">{warningSummary}</p> : null}
      </td>
      <td className="px-2.5 py-2.5 text-slate-700">
        <p>{item.paidDayUnits.toFixed(2)} paid days</p>
        <p>
          P {item.presentCount} · L {item.lateCount} · H {item.halfDayCount} · A {item.absentCount}
        </p>
        <p>{formatWorkedDuration(item.workedMinutes)}</p>
      </td>
      <td className="px-2.5 py-2.5 text-right text-slate-700">
        <p>{formatPrintCurrency(item.basePay)}</p>
        <p className="text-[9.5px]">
          Day {formatPrintCurrencyNumber(item.dailyRateUsed)}
        </p>
        {item.allowancePay > 0 ? (
          <p className="text-[9.5px]">Allowance {formatPrintCurrency(item.allowancePay)}</p>
        ) : null}
      </td>
      <td className="px-2.5 py-2.5 text-right text-slate-700">
        <p>{formatPrintCurrency(item.holidayPremiumPay + item.overtimePay)}</p>
        <p className="text-[9.5px]">Holiday {formatPrintCurrency(item.holidayPremiumPay)}</p>
        <p className="text-[9.5px]">OT {formatPrintCurrency(item.overtimePay)}</p>
      </td>
      <td className="px-2.5 py-2.5 text-right text-slate-700">
        <p>Late -{formatPrintCurrency(item.lateDeductionAmount)}</p>
        <p className="text-[9.5px]">Add {formatPrintCurrency(item.manualAdditionsTotal)}</p>
        <p className="text-[9.5px]">Less {formatPrintCurrency(item.manualDeductionsTotal)}</p>
      </td>
      <td className="px-2.5 py-2.5 text-right font-semibold text-slate-950">
        {formatPrintCurrency(item.netPay)}
      </td>
      <td className="px-2.5 py-2.5">
        <div className="mt-6 border-b border-slate-400" />
      </td>
    </tr>
  );
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="min-w-0 text-slate-900">{value}</p>
    </div>
  );
}

function buildDocumentMeta(
  period: PayrollPrintDocument["period"],
  pageNumber: number,
  pageCount: number,
) {
  return `Period: ${period.label} • Payout: ${formatDocumentDate(period.payoutDate)} • Page ${pageNumber} of ${pageCount}`;
}

function buildPayrollPages(items: PayrollPeriodItemSummary[]) {
  const firstRows = items.slice(0, FIRST_PAGE_ROW_COUNT);
  const remainingRows = items.slice(FIRST_PAGE_ROW_COUNT);
  const pages: Array<{
    key: string;
    rows: PayrollPeriodItemSummary[];
    includeOverview: boolean;
    includeClosing: boolean;
  }> = [
    {
      key: "page-1",
      rows: firstRows,
      includeOverview: true,
      includeClosing: remainingRows.length === 0,
    },
  ];

  let pageIndex = 2;
  for (let startIndex = 0; startIndex < remainingRows.length; startIndex += FOLLOWING_PAGE_ROW_COUNT) {
    const rows = remainingRows.slice(startIndex, startIndex + FOLLOWING_PAGE_ROW_COUNT);
    const isLastPage = startIndex + FOLLOWING_PAGE_ROW_COUNT >= remainingRows.length;

    pages.push({
      key: `page-${pageIndex}`,
      rows,
      includeOverview: false,
      includeClosing: isLastPage,
    });
    pageIndex += 1;
  }

  return pages;
}
