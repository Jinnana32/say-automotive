export const PRINT_PAPER_SIZES = ["a4", "short-bond"] as const;

export type PrintPaperSize = (typeof PRINT_PAPER_SIZES)[number];

export const DEFAULT_PRINT_PAPER_SIZE: PrintPaperSize = "a4";

export const PRINT_PAPER_SIZE_STORAGE_KEY = "say-print-paper-size";

export const PRINT_PAPER_SIZE_OPTIONS: ReadonlyArray<{
  value: PrintPaperSize;
  label: string;
  description: string;
}> = [
  {
    value: "a4",
    label: "A4",
    description: "210 × 297 mm",
  },
  {
    value: "short-bond",
    label: "Short bond",
    description: "Letter 8.5 × 11 in",
  },
];

/**
 * Body capacity vs full on-screen page preview.
 * Letter is ~6% shorter than A4; keep scale near that ratio so short bond does not
 * over-split into empty-looking pages after Qty stayed numeric-only.
 */
export const PRINT_PAPER_CAPACITY_SCALE: Record<PrintPaperSize, number> = {
  a4: 1,
  "short-bond": 0.94,
};

/** Physical paper size in mm (CSS @page / preview cards). */
export const PRINT_PAPER_DIMENSIONS_MM: Record<
  PrintPaperSize,
  { width: number; height: number }
> = {
  a4: { width: 210, height: 297 },
  "short-bond": { width: 215.9, height: 279.4 },
};

/**
 * Inset used when generating PDFs so footers stay above typical printer
 * non-printable edges (full-bleed PDFs look fine on screen, then clip on paper).
 */
export const PDF_PRINTER_SAFE_MARGIN_MM = {
  top: 10,
  right: 8,
  bottom: 12,
  left: 8,
} as const;

export function isPrintPaperSize(value: unknown): value is PrintPaperSize {
  return value === "a4" || value === "short-bond";
}

export function resolvePrintPaperSize(value?: string | null): PrintPaperSize {
  if (isPrintPaperSize(value)) {
    return value;
  }

  return DEFAULT_PRINT_PAPER_SIZE;
}

export function scalePrintCapacity(baseCapacity: number, paperSize: PrintPaperSize) {
  return baseCapacity * PRINT_PAPER_CAPACITY_SCALE[paperSize];
}

export function withPrintPaperSearchParam(
  href: string,
  paperSize: PrintPaperSize,
) {
  const url = new URL(href, "https://say.local");
  applyPrintPaperSearchParam(url, paperSize);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function applyPrintPaperSearchParam(
  url: URL,
  paperSize: PrintPaperSize,
) {
  if (paperSize === DEFAULT_PRINT_PAPER_SIZE) {
    url.searchParams.delete("paper");
  } else {
    url.searchParams.set("paper", paperSize);
  }
}

export function readPrintPaperSizeFromSearchParams(
  searchParams: URLSearchParams | { get(name: string): string | null },
) {
  return resolvePrintPaperSize(searchParams.get("paper"));
}
