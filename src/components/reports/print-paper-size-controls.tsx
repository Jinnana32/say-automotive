"use client";

import { Button } from "@/components/ui/button";
import {
  PRINT_PAPER_SIZE_OPTIONS,
  type PrintPaperSize,
} from "@/lib/reports/print-paper-size";
import { cn } from "@/lib/utils";

export function PrintPaperSizeControls({
  value,
  onChange,
  className,
}: {
  value: PrintPaperSize;
  onChange: (paperSize: PrintPaperSize) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
      role="group"
      aria-label="Paper size"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Paper
      </span>
      {PRINT_PAPER_SIZE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "bluePrimary" : "outline"}
          title={option.description}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
