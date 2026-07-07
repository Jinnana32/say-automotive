import { PrintDocumentPage } from "@/components/reports/print-document-page";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { ReportSectionHeading } from "@/components/reports/report-section-heading";
import type { PayslipPrintDocument } from "@/features/payroll/types";
import {
  formatPayBasisLabel,
  formatPayrollCoverage,
  formatPayrollDayUnits,
  formatWorkedDuration,
} from "@/features/payroll/utils";
import { formatCurrencyForPayslip } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export function PayslipPrintLayout({
  document,
}: {
  document: PayslipPrintDocument;
}) {
  const { period, item, businessProfile, generatedAt } = document;

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
              </div>
            </div>
          </div>

          <div className="overflow-hidden border border-brand-border bg-brand-soft/35 px-3 py-1.5">
            <PayslipSummary item={item} />
          </div>
        </section>

        <section className="report-section-keep mt-5">
          <ReportSectionHeading title="ATTENDANCE SUMMARY" />
          <div className="grid gap-x-5 gap-y-2 text-[10.75px] sm:grid-cols-2 lg:grid-cols-3">
            <MetadataRow
              label="Paid days"
              value={formatPayrollDayUnits(item.paidDayUnits)}
            />
            <MetadataRow label="On-time days" value={String(item.presentCount)} />
            <MetadataRow label="Late" value={String(item.lateCount)} />
            <MetadataRow label="Half day" value={String(item.halfDayCount)} />
            <MetadataRow label="Absent" value={String(item.absentCount)} />
            <MetadataRow label="Worked hours" value={formatWorkedDuration(item.workedMinutes)} />
            <MetadataRow label="Daily rate used" value={formatCurrencyForPayslip(item.dailyRateUsed)} />
            <MetadataRow label="Hourly rate used" value={formatCurrencyForPayslip(item.hourlyRateUsed)} />
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
                      {formatCurrencyForPayslip(adjustment.amount)}
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

function PayslipSummary({
  item,
}: {
  item: PayslipPrintDocument["item"];
}) {
  const earnings = [
    { label: "Base pay", value: item.basePay },
    { label: "Allowance", value: item.allowancePay },
    { label: "Holiday premium", value: item.holidayPremiumPay },
    { label: "Overtime", value: item.overtimePay },
  ];
  const additions =
    item.manualAdditionsTotal > 0
      ? [{ label: "Manual additions", value: item.manualAdditionsTotal }]
      : [];

  return (
    <div className="w-full max-w-[250px] text-[12px]">
      <PayslipSummaryGroup title="Earnings" lines={[...earnings, ...additions]} />
      <PayslipSummaryGroup
        title="Deductions"
        lines={[
          { label: "Late deductions", value: item.lateDeductionAmount },
          { label: "Manual deductions", value: item.manualDeductionsTotal },
        ]}
      />
      <div className="mt-1 border-t border-brand-border pt-1">
        <PayslipSummaryLine label="Net pay" value={item.netPay} emphasized />
      </div>
    </div>
  );
}

function PayslipSummaryGroup({
  title,
  lines,
}: {
  title: string;
  lines: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="border-b border-brand-border/70 py-1 last:border-b-0">
      <p className="pb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      {lines.map((line) => (
        <PayslipSummaryLine key={line.label} label={line.label} value={line.value} />
      ))}
    </div>
  );
}

function PayslipSummaryLine({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <p className={emphasized ? "font-semibold text-brand-navy" : "font-semibold text-slate-700"}>
        {label}:
      </p>
      <p
        className={
          emphasized
            ? "text-[14px] font-semibold text-brand-navy"
            : "font-semibold text-slate-700"
        }
      >
        {formatCurrencyForPayslip(value)}
      </p>
    </div>
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
