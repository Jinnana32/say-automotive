"use client";

import { Suspense } from "react";
import { Download, Printer } from "lucide-react";

import { PrintPaperSizeControls } from "@/components/reports/print-paper-size-controls";
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
  const resolvedDownloadHref = downloadHref
    ? withPrintPaperSearchParam(downloadHref, paperSize)
    : undefined;
  const resolvedAlternatePrintHref = alternatePrintHref
    ? withPrintPaperSearchParam(alternatePrintHref, paperSize)
    : undefined;

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
      <Suspense fallback={null}>
        <ReportToolbarPaperSize paperSize={paperSize} />
      </Suspense>
      {resolvedAlternatePrintHref ? (
        <ActionDropdown
          label="Print"
          variant="outlineBlue"
          size="sm"
          items={[
            showingAlternatePrint
              ? {
                  label: "Print",
                  href: `${resolvedAlternatePrintHref}${resolvedAlternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                }
              : {
                  label: "Print",
                  onSelect: () => window.print(),
                },
            showingAlternatePrint
              ? {
                  label: "Print without prices",
                  onSelect: () => window.print(),
                }
              : {
                  label: "Print without prices",
                  href: `${resolvedAlternatePrintHref}${resolvedAlternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                },
          ]}
        />
      ) : (
        <Button type="button" variant="outlineBlue" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      )}
      {resolvedDownloadHref ? (
        <Button asChild type="button" variant="bluePrimary" size="sm">
          <a href={resolvedDownloadHref}>
            <Download className="size-4" />
            Download PDF
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function ReportToolbarPaperSize({ paperSize }: { paperSize: PrintPaperSize }) {
  const setPaperSize = usePrintPaperSizeNavigation();
  return <PrintPaperSizeControls value={paperSize} onChange={setPaperSize} />;
}
