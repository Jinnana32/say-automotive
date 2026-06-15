import type { NextRequest } from "next/server";

import { getPayrollPrintDocument } from "@/features/payroll/queries/payroll-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayrollPdfRouteContext = {
  params: Promise<{
    periodId: string;
  }>;
};

export async function GET(request: NextRequest, context: PayrollPdfRouteContext) {
  const { periodId } = await context.params;
  const document = await getPayrollPrintDocument(periodId);

  if (!document) {
    return new Response("Payroll summary not found.", { status: 404 });
  }

  try {
    const printUrl = new URL(`/payroll/${periodId}/print`, request.nextUrl.origin);
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const filename = `SAY-Payroll-${toFilenameSegment(document.period.label)}.pdf`;

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
        : "Unable to generate the payroll PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}

function toFilenameSegment(value: string) {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "payroll-summary";
}
