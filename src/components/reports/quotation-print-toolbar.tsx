"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Download, Printer } from "lucide-react";

import { PrintPaperSizeControls } from "@/components/reports/print-paper-size-controls";
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
  const downloadHref = withPrintPaperSearchParam(
    buildQuotationPdfHref(quotationId, mode),
    paperSize,
  );

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
      <Suspense fallback={null}>
        <QuotationToolbarPaperSize paperSize={paperSize} />
      </Suspense>
      <Button
        type="button"
        variant="outlineBlue"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
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
      <Button asChild type="button" variant="bluePrimary" size="sm">
        <a href={downloadHref}>
          <Download className="size-4" />
          PDF
        </a>
      </Button>
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
