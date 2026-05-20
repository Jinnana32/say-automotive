import type { NextRequest } from "next/server";

import { resolveQuotationPrintMode } from "@/features/quotations/report-utils";
import { getQuotationPrintDocument } from "@/features/quotations/queries/quotation-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuotationPdfRouteContext = {
  params: Promise<{
    quotationId: string;
  }>;
};

export async function GET(request: NextRequest, context: QuotationPdfRouteContext) {
  const { quotationId } = await context.params;
  const mode = resolveQuotationPrintMode(request.nextUrl.searchParams.get("mode"));
  const document = await getQuotationPrintDocument(quotationId);

  if (!document) {
    return new Response("Quotation not found.", { status: 404 });
  }

  try {
    const printUrl = new URL(`/quotations/${quotationId}/print`, request.nextUrl.origin);
    if (mode !== "full") {
      printUrl.searchParams.set("mode", mode);
    }
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const filename = `SAY-Quotation-${document.quotation.quotationNumber}${mode === "full" ? "" : `-${mode}`}.pdf`;

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
        : "Unable to generate the quotation PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
