import { notFound } from "next/navigation";

import { PayslipPrintLayout } from "@/components/reports/payslip-print-layout";
import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getPayslipPrintDocument } from "@/features/payroll/queries/payroll-print-queries";

export const dynamic = "force-dynamic";

type PayslipPrintPageProps = {
  params: Promise<{
    periodId: string;
    itemId: string;
  }>;
  searchParams?: Promise<{
    autoprint?: string;
  }>;
};

export default async function PayslipPrintPage({
  params,
  searchParams,
}: PayslipPrintPageProps) {
  const { periodId, itemId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const document = await getPayslipPrintDocument(periodId, itemId);
  const autoPrint = resolvedSearchParams?.autoprint === "1";

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      wrapInPrintPage={false}
      toolbar={
        <ReportToolbar
          downloadHref={`/api/payroll/${document.period.id}/payslip/${document.item.id}/pdf`}
        />
      }
    >
      <ReportAutoPrint enabled={autoPrint} />
      <PayslipPrintLayout document={document} />
    </ReportPage>
  );
}
