"use client";

import Link from "next/link";
import { Download, Printer, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportToolbar({
  backHref,
  downloadHref,
}: {
  backHref: string;
  downloadHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <Button type="button" variant="outlineBlue" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print
      </Button>
      <Button asChild type="button" variant="bluePrimary" size="sm">
        <a href={downloadHref}>
          <Download className="size-4" />
          Download PDF
        </a>
      </Button>
      <Button asChild type="button" variant="outline" size="sm">
        <Link href={backHref}>
          <Undo2 className="size-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}
