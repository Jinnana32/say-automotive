"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";

import { PrintPaperSizeControls } from "@/components/reports/print-paper-size-controls";
import {
  downloadPdfFromHref,
  printPdfFromHref,
} from "@/components/reports/print-pdf";
import { usePrintPaperSizeNavigation } from "@/components/reports/use-print-paper-size-navigation";
import { Button } from "@/components/ui/button";
import type { QuotationPrintMode } from "@/features/quotations/types";
import {
  DEFAULT_PRINT_PAPER_SIZE,
  type PrintPaperSize,
  withPrintPaperSearchParam,
} from "@/lib/reports/print-paper-size";

const MODE_OPTIONS: ReadonlyArray<{
  value: QuotationPrintMode;
  label: string;
}> = [
  { value: "full", label: "Full" },
  { value: "parts", label: "Parts Only" },
  { value: "labor", label: "Labor Only" },
];

export function QuotationPrintToolbar({
  quotationId,
  mode,
  paperSize = DEFAULT_PRINT_PAPER_SIZE,
}: {
  quotationId: string;
  mode: QuotationPrintMode;
  paperSize?: PrintPaperSize;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const downloadHref = withPrintPaperSearchParam(
    buildQuotationPdfHref(quotationId, mode),
    paperSize,
  );

  async function runPdfAction(action: () => Promise<void>) {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate the PDF.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex max-w-full flex-col items-center gap-2">
      <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
        <Suspense fallback={null}>
          <QuotationToolbarPaperSize paperSize={paperSize} />
        </Suspense>
        <Button
          type="button"
          variant="outlineBlue"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            void runPdfAction(() => printPdfFromHref(downloadHref));
          }}
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
          Print
        </Button>
        {MODE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            asChild
            type="button"
            size="sm"
            variant={mode === option.value ? "bluePrimary" : "outline"}
          >
            <Link
              href={withPrintPaperSearchParam(
                buildQuotationPrintHref(quotationId, option.value),
                paperSize,
              )}
            >
              {option.label}
            </Link>
          </Button>
        ))}
        <Button
          type="button"
          variant="bluePrimary"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            void runPdfAction(() =>
              downloadPdfFromHref(downloadHref, "quotation.pdf"),
            );
          }}
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          PDF
        </Button>
      </div>
      {errorMessage ? (
        <p className="max-w-xl text-center text-[12px] text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function QuotationToolbarPaperSize({ paperSize }: { paperSize: PrintPaperSize }) {
  const setPaperSize = usePrintPaperSizeNavigation();
  return <PrintPaperSizeControls value={paperSize} onChange={setPaperSize} />;
}

function buildQuotationPrintHref(
  quotationId: string,
  mode: QuotationPrintMode,
) {
  if (mode === "full") {
    return `/quotations/${quotationId}/print`;
  }

  return `/quotations/${quotationId}/print?mode=${mode}`;
}

function buildQuotationPdfHref(quotationId: string, mode: QuotationPrintMode) {
  if (mode === "full") {
    return `/api/quotations/${quotationId}/pdf`;
  }

  return `/api/quotations/${quotationId}/pdf?mode=${mode}`;
}
