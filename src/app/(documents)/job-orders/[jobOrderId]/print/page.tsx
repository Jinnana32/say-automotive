import { notFound } from "next/navigation";

import { ReportAutoPrint } from "@/components/reports/report-auto-print";
import { JobOrderPrintLayout } from "@/components/reports/job-order-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getJobOrderPrintDocument } from "@/features/job-orders/queries/job-order-print-queries";
import { resolvePrintPaperSize } from "@/lib/reports/print-paper-size";

export const dynamic = "force-dynamic";

type JobOrderPrintPageProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
  searchParams?: Promise<{
    hidePrices?: string;
    autoprint?: string;
    paper?: string;
  }>;
};

export default async function JobOrderPrintPage({
  params,
  searchParams,
}: JobOrderPrintPageProps) {
  const { jobOrderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const document = await getJobOrderPrintDocument(jobOrderId);
  const hidePrices = resolvedSearchParams?.hidePrices === "1";
  const autoPrint = resolvedSearchParams?.autoprint === "1";
  const paperSize = resolvePrintPaperSize(resolvedSearchParams?.paper);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      wrapInPrintPage={false}
      paperSize={paperSize}
      toolbar={
        <ReportToolbar
          paperSize={paperSize}
          downloadHref={`/api/job-orders/${document.jobOrder.id}/pdf${hidePrices ? "?hidePrices=1" : ""}`}
          alternatePrintHref={`/job-orders/${document.jobOrder.id}/print${hidePrices ? "" : "?hidePrices=1"}`}
          showingAlternatePrint={hidePrices}
        />
      }
    >
      <ReportAutoPrint enabled={autoPrint} />
      <JobOrderPrintLayout
        document={document}
        hidePrices={hidePrices}
        paperSize={paperSize}
      />
    </ReportPage>
  );
}
