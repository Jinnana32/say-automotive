"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { QuotationPrintMode } from "@/features/quotations/types";

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
}: {
  quotationId: string;
  mode: QuotationPrintMode;
}) {
  const downloadHref = buildQuotationPdfHref(quotationId, mode);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <Button
        type="button"
        variant="outlineBlue"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Print Current View
      </Button>
      {MODE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          asChild
          type="button"
          size="sm"
          variant={mode === option.value ? "bluePrimary" : "outline"}
        >
          <Link href={buildQuotationPrintHref(quotationId, option.value)}>
            {`Print ${option.label}`}
          </Link>
        </Button>
      ))}
      <Button asChild type="button" variant="bluePrimary" size="sm">
        <a href={downloadHref}>
          <Download className="size-4" />
          Download PDF
        </a>
      </Button>
    </div>
  );
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
