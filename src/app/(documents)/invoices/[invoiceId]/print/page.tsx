import { notFound } from "next/navigation";

import { InvoicePrintLayout } from "@/components/reports/invoice-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getInvoicePrintDocument } from "@/features/invoices/queries/invoice-print-queries";

export const dynamic = "force-dynamic";

type InvoicePrintPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const { invoiceId } = await params;
  const document = await getInvoicePrintDocument(invoiceId);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      toolbar={
        <ReportToolbar
          downloadHref={`/api/invoices/${document.invoice.id}/pdf`}
        />
      }
    >
      <InvoicePrintLayout document={document} />
    </ReportPage>
  );
}
