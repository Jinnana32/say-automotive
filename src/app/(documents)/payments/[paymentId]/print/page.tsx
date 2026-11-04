import { notFound } from "next/navigation";

import { PaymentPrintLayout } from "@/components/reports/payment-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getPaymentPrintDocument } from "@/features/invoices/queries/payment-print-queries";
import { resolvePrintPaperSize } from "@/lib/reports/print-paper-size";

export const dynamic = "force-dynamic";

type PaymentPrintPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
  searchParams?: Promise<{
    paper?: string;
  }>;
};

export default async function PaymentPrintPage({
  params,
  searchParams,
}: PaymentPrintPageProps) {
  const { paymentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const paperSize = resolvePrintPaperSize(resolvedSearchParams?.paper);
  const document = await getPaymentPrintDocument(paymentId);

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
          downloadHref={`/api/payments/${document.payment.id}/pdf`}
        />
      }
    >
      <PaymentPrintLayout document={document} />
    </ReportPage>
  );
}
