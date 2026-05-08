import { notFound } from "next/navigation";

import { QuotationPrintLayout } from "@/components/reports/quotation-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getQuotationPrintDocument } from "@/features/quotations/queries/quotation-print-queries";

export const dynamic = "force-dynamic";

type QuotationPrintPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationPrintPage({
  params,
}: QuotationPrintPageProps) {
  const { quotationId } = await params;
  const document = await getQuotationPrintDocument(quotationId);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      toolbar={
        <ReportToolbar
          backHref={`/quotations/${document.quotation.id}`}
          downloadHref={`/api/quotations/${document.quotation.id}/pdf`}
        />
      }
    >
      <QuotationPrintLayout document={document} />
    </ReportPage>
  );
}
