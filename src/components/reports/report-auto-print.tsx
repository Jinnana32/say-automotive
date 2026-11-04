"use client";

import { useEffect, useState } from "react";

import { printPdfFromHref } from "@/components/reports/print-pdf";

export function ReportAutoPrint({
  enabled,
  pdfHref,
}: {
  enabled: boolean;
  pdfHref: string;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !pdfHref) {
      return;
    }

    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      void (async () => {
        try {
          await printPdfFromHref(pdfHref);
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to generate the PDF for printing.",
            );
          }
        } finally {
          if (!cancelled) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete("autoprint");
            window.history.replaceState(null, "", nextUrl.toString());
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [enabled, pdfHref]);

  if (!errorMessage) {
    return null;
  }

  return (
    <p className="no-print mx-auto mb-3 max-w-xl text-center text-[12px] text-red-600">
      {errorMessage}
    </p>
  );
}
