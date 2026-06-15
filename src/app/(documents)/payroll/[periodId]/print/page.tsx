import { notFound } from "next/navigation";

import { PayrollPrintLayout } from "@/components/reports/payroll-print-layout";
import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getPayrollPrintDocument } from "@/features/payroll/queries/payroll-print-queries";

export const dynamic = "force-dynamic";

type PayrollPrintPageProps = {
  params: Promise<{
    periodId: string;
  }>;
  searchParams?: Promise<{
    autoprint?: string;
  }>;
};

export default async function PayrollPrintPage({
  params,
  searchParams,
}: PayrollPrintPageProps) {
  const { periodId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const document = await getPayrollPrintDocument(periodId);
  const autoPrint = resolvedSearchParams?.autoprint === "1";

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      wrapInPrintPage={false}
      toolbar={<ReportToolbar downloadHref={`/api/payroll/${document.period.id}/pdf`} />}
    >
      <ReportAutoPrint enabled={autoPrint} />
      <PayrollPrintLayout document={document} />
    </ReportPage>
  );
}
