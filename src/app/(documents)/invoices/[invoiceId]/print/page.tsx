import { notFound } from "next/navigation";

import { InvoicePrintLayout } from "@/components/reports/invoice-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getInvoicePrintDocument } from "@/features/invoices/queries/invoice-print-queries";
import { resolvePrintPaperSize } from "@/lib/reports/print-paper-size";

export const dynamic = "force-dynamic";

type InvoicePrintPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams?: Promise<{
    paper?: string;
  }>;
};

export default async function InvoicePrintPage({
  params,
  searchParams,
}: InvoicePrintPageProps) {
  const { invoiceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const paperSize = resolvePrintPaperSize(resolvedSearchParams?.paper);
  const document = await getInvoicePrintDocument(invoiceId);

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
          downloadHref={`/api/invoices/${document.invoice.id}/pdf`}
        />
      }
    >
      <InvoicePrintLayout document={document} paperSize={paperSize} />
    </ReportPage>
  );
}
