import type { ReactNode } from "react";

import { PrintPaperSizeSync } from "@/components/reports/print-paper-size-sync";
import {
  DEFAULT_PRINT_PAPER_SIZE,
  type PrintPaperSize,
} from "@/lib/reports/print-paper-size";
import { cn } from "@/lib/utils";

export function ReportPage({
  toolbar,
  children,
  className,
  wrapInPrintPage = true,
  paperSize = DEFAULT_PRINT_PAPER_SIZE,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  wrapInPrintPage?: boolean;
  paperSize?: PrintPaperSize;
}) {
  return (
    <div
      className="report-preview-shell px-4 py-5 sm:px-6"
      data-print-paper={paperSize}
    >
      <PrintPaperSizeSync paperSize={paperSize} />
      {toolbar ? (
        <div className="no-print mx-auto mb-4 flex w-full max-w-5xl justify-center overflow-x-auto">
          {toolbar}
        </div>
      ) : null}
      <div
        className={cn(
          wrapInPrintPage
            ? "report-print-page print-page"
            : "report-print-content",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
