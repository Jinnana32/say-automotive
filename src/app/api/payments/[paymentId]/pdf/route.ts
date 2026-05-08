import type { NextRequest } from "next/server";

import { getPaymentPrintDocument } from "@/features/invoices/queries/payment-print-queries";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentPdfRouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function GET(request: NextRequest, context: PaymentPdfRouteContext) {
  const { paymentId } = await context.params;
  const document = await getPaymentPrintDocument(paymentId);

  if (!document) {
    return new Response("Payment not found.", { status: 404 });
  }

  try {
    const printUrl = new URL(`/payments/${paymentId}/print`, request.nextUrl.origin);
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader: request.headers.get("cookie"),
    });
    const safeDate = document.payment.paidAt.slice(0, 10);
    const filename = `SAY-Payment-${document.payment.invoiceNumber}-${safeDate}.pdf`;

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
        : "Unable to generate the payment PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
