import { notFound } from "next/navigation";

import { PaymentPrintLayout } from "@/components/reports/payment-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getPaymentPrintDocument } from "@/features/invoices/queries/payment-print-queries";

export const dynamic = "force-dynamic";

type PaymentPrintPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export default async function PaymentPrintPage({ params }: PaymentPrintPageProps) {
  const { paymentId } = await params;
  const document = await getPaymentPrintDocument(paymentId);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      toolbar={
        <ReportToolbar
          downloadHref={`/api/payments/${document.payment.id}/pdf`}
        />
      }
    >
      <PaymentPrintLayout document={document} />
    </ReportPage>
  );
}
