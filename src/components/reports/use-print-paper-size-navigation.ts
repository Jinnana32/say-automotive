"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  DEFAULT_PRINT_PAPER_SIZE,
  type PrintPaperSize,
} from "@/lib/reports/print-paper-size";

export function usePrintPaperSizeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (paperSize: PrintPaperSize) => {
      const params = new URLSearchParams(searchParams.toString());
      if (paperSize === DEFAULT_PRINT_PAPER_SIZE) {
        params.delete("paper");
      } else {
        params.set("paper", paperSize);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}
