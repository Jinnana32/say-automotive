import { notFound } from "next/navigation";

import { JobOrderPrintLayout } from "@/components/reports/job-order-print-layout";
import { ReportPage } from "@/components/reports/report-page";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { getJobOrderPrintDocument } from "@/features/job-orders/queries/job-order-print-queries";

export const dynamic = "force-dynamic";

type JobOrderPrintPageProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
};

export default async function JobOrderPrintPage({ params }: JobOrderPrintPageProps) {
  const { jobOrderId } = await params;
  const document = await getJobOrderPrintDocument(jobOrderId);

  if (!document) {
    notFound();
  }

  return (
    <ReportPage
      toolbar={
        <ReportToolbar
          backHref={`/job-orders/${document.jobOrder.id}`}
          downloadHref={`/api/job-orders/${document.jobOrder.id}/pdf`}
        />
      }
    >
      <JobOrderPrintLayout document={document} />
    </ReportPage>
  );
}
