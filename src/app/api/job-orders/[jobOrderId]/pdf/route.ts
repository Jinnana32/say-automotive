import type { NextRequest } from "next/server";

import { getJobOrderPrintDocument } from "@/features/job-orders/queries/job-order-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JobOrderPdfRouteContext = {
  params: Promise<{
    jobOrderId: string;
  }>;
};

export async function GET(request: NextRequest, context: JobOrderPdfRouteContext) {
  const { jobOrderId } = await context.params;
  const document = await getJobOrderPrintDocument(jobOrderId);

  if (!document) {
    return new Response("Job order not found.", { status: 404 });
  }

  try {
    const printUrl = new URL(`/job-orders/${jobOrderId}/print`, request.nextUrl.origin);
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const filename = `SAY-JobOrder-${document.jobOrder.jobOrderNumber}.pdf`;

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate the job order PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
