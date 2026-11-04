import { ReportsPrintLayout } from "@/components/reports/reports-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getReportsPrintDocument } from "@/features/reports/queries/report-print-queries";
import { resolvePrintPaperSize } from "@/lib/reports/print-paper-size";

export const dynamic = "force-dynamic";

type ReportsPrintPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
    paper?: string;
  }>;
};

export default async function ReportsPrintPage({ searchParams }: ReportsPrintPageProps) {
  const resolvedSearchParams = await searchParams;
  const paperSize = resolvePrintPaperSize(resolvedSearchParams.paper);
  const document = await getReportsPrintDocument(resolvedSearchParams);
  const search = new URLSearchParams({
    preset: document.reports.filters.preset,
    from: document.reports.filters.from,
    to: document.reports.filters.to,
    groupBy: document.reports.filters.groupBy,
  }).toString();

  return (
    <ReportPage
      wrapInPrintPage={false}
      paperSize={paperSize}
      toolbar={
        <ReportToolbar
          paperSize={paperSize}
          downloadHref={`/api/reports/pdf?${search}`}
        />
      }
    >
      <ReportsPrintLayout document={document} />
    </ReportPage>
  );
}
