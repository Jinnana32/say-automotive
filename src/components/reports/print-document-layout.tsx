import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PrintDocumentLayout({
  header,
  footer,
  children,
  className,
  bodyClassName = "pb-[8mm]",
  horizontalPaddingClassName = "px-[12mm]",
  topPaddingClassName = "pt-[10mm]",
  bottomPaddingClassName = "pb-[10mm]",
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
}) {
  return (
    <article
      className={cn(
        "print-document-frame flex min-h-[297mm] flex-col bg-white text-[11px] text-slate-900",
        className,
      )}
    >
      <div
        className={cn(
          "print-document-header shrink-0",
          horizontalPaddingClassName,
          topPaddingClassName,
        )}
      >
        {header}
      </div>
      <div
        className={cn(
          "print-document-body min-h-0 flex-1",
          horizontalPaddingClassName,
          bodyClassName,
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "print-document-footer mt-auto shrink-0",
          horizontalPaddingClassName,
          bottomPaddingClassName,
        )}
      >
        {footer}
      </div>
    </article>
  );
}
