"use client";

import { useLayoutEffect } from "react";

import type { PrintPaperSize } from "@/lib/reports/print-paper-size";
import { PRINT_PAPER_SIZE_STORAGE_KEY } from "@/lib/reports/print-paper-size";

export function PrintPaperSizeSync({ paperSize }: { paperSize: PrintPaperSize }) {
  useLayoutEffect(() => {
    document.documentElement.dataset.printPaper = paperSize;
    window.localStorage.setItem(PRINT_PAPER_SIZE_STORAGE_KEY, paperSize);

    return () => {
      delete document.documentElement.dataset.printPaper;
    };
  }, [paperSize]);

  return null;
}
