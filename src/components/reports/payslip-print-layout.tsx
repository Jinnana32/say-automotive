import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import { ReportTotals } from "@/components/reports/report-totals";
import type { PayslipPrintDocument } from "@/features/payroll/types";
import {
  formatPayBasisLabel,
  formatPayrollCoverage,
  formatPayrollDayUnits,
  formatWorkedDuration,
} from "@/features/payroll/utils";
import { formatCurrencyForPrint } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export function PayslipPrintLayout({
  document,
}: {
  document: PayslipPrintDocument;
}) {
  const { period, settings, item, businessProfile, generatedAt } = document;

  return (
    <PrintPageStack className="leading-[1.35]">
      <PrintDocumentPage
        businessProfile={businessProfile}
        documentTitle="Payslip"
        documentMeta={`${item.fullName} · ${period.label}`}
        className="leading-[1.35]"
        bodyClassName="pb-[8mm]"
      >
        <section className="report-section-keep mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.35fr)_250px]">
          <div className="space-y-3">
            <div>
              <ReportSectionHeading title="EMPLOYEE" />
              <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2">
                <MetadataRow label="Name" value={item.fullName} />
                <MetadataRow label="Role" value={item.role.replaceAll("_", " ")} />
                <MetadataRow
                  label="Pay basis"
                  value={item.payBasis ? formatPayBasisLabel(item.payBasis) : "Not configured"}
                />
                <MetadataRow label="Generated" value={formatDateTime(generatedAt)} />
              </div>
            </div>

            <div>
              <ReportSectionHeading title="PAYROLL PERIOD" />
              <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2">
                <MetadataRow label="Label" value={period.label} />
                <MetadataRow
                  label="Coverage"
                  value={formatPayrollCoverage(period.periodStartDate, period.periodEndDate)}
                />
                <MetadataRow label="Payout date" value={formatDate(period.payoutDate)} />
                <MetadataRow
                  label="Payroll rule"
                  value={`${settings.standardDailyHours}h day · ${(settings.holidayPremiumRate * 100).toFixed(2)}% holiday premium`}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-1.5">
            <ReportTotals
              lines={[
                { label: "Base pay:", value: formatCurrencyForPrint(item.basePay) },
                { label: "Allowance:", value: formatCurrencyForPrint(item.allowancePay) },
                { label: "Holiday premium:", value: formatCurrencyForPrint(item.holidayPremiumPay) },
                { label: "Overtime:", value: formatCurrencyForPrint(item.overtimePay) },
                { label: "Late deductions:", value: formatCurrencyForPrint(item.lateDeductionAmount) },
                { label: "Manual additions:", value: formatCurrencyForPrint(item.manualAdditionsTotal) },
                { label: "Manual deductions:", value: formatCurrencyForPrint(item.manualDeductionsTotal) },
                { label: "Net pay:", value: formatCurrencyForPrint(item.netPay), emphasized: true },
              ]}
            />
          </div>
        </section>

        <section className="report-section-keep mt-5">
          <ReportSectionHeading title="ATTENDANCE SUMMARY" />
          <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2 lg:grid-cols-3">
            <MetadataRow
              label="Paid days"
              value={formatPayrollDayUnits(item.paidDayUnits)}
            />
            <MetadataRow label="Present" value={String(item.presentCount)} />
            <MetadataRow label="Late" value={String(item.lateCount)} />
            <MetadataRow label="Half day" value={String(item.halfDayCount)} />
            <MetadataRow label="Absent" value={String(item.absentCount)} />
            <MetadataRow label="Worked hours" value={formatWorkedDuration(item.workedMinutes)} />
            <MetadataRow label="Daily rate used" value={formatCurrencyForPrint(item.dailyRateUsed)} />
            <MetadataRow label="Hourly rate used" value={formatCurrencyForPrint(item.hourlyRateUsed)} />
          </div>
        </section>

        {item.adjustments.length > 0 ? (
          <section className="report-section-keep mt-5">
            <ReportSectionHeading title="MANUAL ADJUSTMENTS" />
            <table className="w-full border-collapse text-[10.75px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-2.5 py-2 font-semibold">Type</th>
                  <th className="px-2.5 py-2 font-semibold">Label</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {item.adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="border-b border-slate-100">
                    <td className="px-2.5 py-2 capitalize">{adjustment.adjustmentType}</td>
                    <td className="px-2.5 py-2">{adjustment.label}</td>
                    <td className="px-2.5 py-2 text-right">
                      {formatCurrencyForPrint(adjustment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </PrintDocumentPage>
    </PrintPageStack>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-slate-950">{value}</p>
    </div>
  );
}
