"use client";

import { Suspense, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";

import { PrintPaperSizeControls } from "@/components/reports/print-paper-size-controls";
import {
  downloadPdfFromHref,
  printPdfFromHref,
} from "@/components/reports/print-pdf";
import { usePrintPaperSizeNavigation } from "@/components/reports/use-print-paper-size-navigation";
import { ActionDropdown } from "@/components/shared/action-dropdown";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PRINT_PAPER_SIZE,
  type PrintPaperSize,
  withPrintPaperSearchParam,
} from "@/lib/reports/print-paper-size";

export function ReportToolbar({
  downloadHref,
  alternatePrintHref,
  showingAlternatePrint = false,
  paperSize = DEFAULT_PRINT_PAPER_SIZE,
}: {
  downloadHref?: string;
  alternatePrintHref?: string;
  showingAlternatePrint?: boolean;
  paperSize?: PrintPaperSize;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedDownloadHref = downloadHref
    ? withPrintPaperSearchParam(downloadHref, paperSize)
    : undefined;
  const resolvedAlternatePrintHref = alternatePrintHref
    ? withPrintPaperSearchParam(alternatePrintHref, paperSize)
    : undefined;

  async function runPdfAction(action: () => Promise<void>) {
    if (!resolvedDownloadHref || isBusy) {
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
          <ReportToolbarPaperSize paperSize={paperSize} />
        </Suspense>
        {resolvedAlternatePrintHref && resolvedDownloadHref ? (
          <ActionDropdown
            label={isBusy ? "Working…" : "Print"}
            variant="outlineBlue"
            size="sm"
            disabled={isBusy}
            items={[
              showingAlternatePrint
                ? {
                    label: "Print",
                    href: `${resolvedAlternatePrintHref}${resolvedAlternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                  }
                : {
                    label: "Print",
                    onSelect: () => {
                      void runPdfAction(() => printPdfFromHref(resolvedDownloadHref));
                    },
                  },
              showingAlternatePrint
                ? {
                    label: "Print without prices",
                    onSelect: () => {
                      void runPdfAction(() => printPdfFromHref(resolvedDownloadHref));
                    },
                  }
                : {
                    label: "Print without prices",
                    href: `${resolvedAlternatePrintHref}${resolvedAlternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                  },
            ]}
          />
        ) : resolvedDownloadHref ? (
          <Button
            type="button"
            variant="outlineBlue"
            size="sm"
            disabled={isBusy}
            onClick={() => {
              void runPdfAction(() => printPdfFromHref(resolvedDownloadHref));
            }}
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Print
          </Button>
        ) : null}
        {resolvedDownloadHref ? (
          <Button
            type="button"
            variant="bluePrimary"
            size="sm"
            disabled={isBusy}
            onClick={() => {
              void runPdfAction(() =>
                downloadPdfFromHref(resolvedDownloadHref, "document.pdf"),
              );
            }}
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download PDF
          </Button>
        ) : null}
      </div>
      {errorMessage ? (
        <p className="max-w-xl text-center text-[12px] text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function ReportToolbarPaperSize({ paperSize }: { paperSize: PrintPaperSize }) {
  const setPaperSize = usePrintPaperSizeNavigation();
  return <PrintPaperSizeControls value={paperSize} onChange={setPaperSize} />;
}
