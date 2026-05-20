import { notFound } from "next/navigation";

import { QuotationPrintLayout } from "@/components/reports/quotation-print-layout";
import { QuotationPrintToolbar } from "@/components/reports/quotation-print-toolbar";
import { ReportPage } from "@/components/reports/report-page";
import { resolveQuotationPrintMode } from "@/features/quotations/report-utils";
import { getQuotationPrintDocument } from "@/features/quotations/queries/quotation-print-queries";

export const dynamic = "force-dynamic";

type QuotationPrintPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function QuotationPrintPage({
  params,
  searchParams,
}: QuotationPrintPageProps) {
  const { quotationId } = await params;
  const { mode: requestedMode } = await searchParams;
  const mode = resolveQuotationPrintMode(requestedMode);
  const document = await getQuotationPrintDocument(quotationId);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      wrapInPrintPage={false}
      toolbar={
        <QuotationPrintToolbar
          quotationId={document.quotation.id}
          mode={mode}
        />
      }
    >
      <QuotationPrintLayout document={document} mode={mode} />
    </ReportPage>
  );
}
