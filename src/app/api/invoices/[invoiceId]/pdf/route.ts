import type { NextRequest } from "next/server";

import { getInvoicePrintDocument } from "@/features/invoices/queries/invoice-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InvoicePdfRouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function GET(request: NextRequest, context: InvoicePdfRouteContext) {
  const { invoiceId } = await context.params;
  const document = await getInvoicePrintDocument(invoiceId);

  if (!document) {
    return new Response("Invoice not found.", { status: 404 });
  }

  try {
    const printUrl = new URL(`/invoices/${invoiceId}/print`, request.nextUrl.origin);
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const filename = `SAY-Invoice-${document.invoice.invoiceNumber}.pdf`;

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
        : "Unable to generate the invoice PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
