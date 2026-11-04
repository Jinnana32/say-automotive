import { notFound } from "next/navigation";

import { PayrollPrintLayout } from "@/components/reports/payroll-print-layout";
import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getPayrollPrintDocument } from "@/features/payroll/queries/payroll-print-queries";
import {
  resolvePrintPaperSize,
  withPrintPaperSearchParam,
} from "@/lib/reports/print-paper-size";

export const dynamic = "force-dynamic";

type PayrollPrintPageProps = {
  params: Promise<{
    periodId: string;
  }>;
  searchParams?: Promise<{
    autoprint?: string;
    paper?: string;
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
  const paperSize = resolvePrintPaperSize(resolvedSearchParams?.paper);

  if (!document) {
    notFound();
  }

  const pdfHref = withPrintPaperSearchParam(
    `/api/payroll/${document.period.id}/pdf`,
    paperSize,
  );

  return (
    <ReportPage
      wrapInPrintPage={false}
      paperSize={paperSize}
      toolbar={
        <ReportToolbar
          paperSize={paperSize}
          downloadHref={`/api/payroll/${document.period.id}/pdf`}
        />
      }
    >
      <ReportAutoPrint enabled={autoPrint} pdfHref={pdfHref} />
      <PayrollPrintLayout document={document} paperSize={paperSize} />
    </ReportPage>
  );
}
