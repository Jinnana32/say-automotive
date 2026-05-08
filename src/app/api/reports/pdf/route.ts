import type { NextRequest } from "next/server";

import { getReportsPrintDocument } from "@/features/reports/queries/report-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = {
    preset: request.nextUrl.searchParams.get("preset") ?? undefined,
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    groupBy: request.nextUrl.searchParams.get("groupBy") ?? undefined,
  };
  const document = await getReportsPrintDocument(input);

  try {
    const printUrl = new URL(`/reports/print?${request.nextUrl.searchParams.toString()}`, request.nextUrl.origin);
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const filename = `SAY-Reports-${document.reports.filters.from}-to-${document.reports.filters.to}.pdf`;

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
        : "Unable to generate the reports PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
