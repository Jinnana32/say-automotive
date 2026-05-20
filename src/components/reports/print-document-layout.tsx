import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PrintPageStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("print-page-stack", className)}>{children}</div>;
}

export function PrintPage({
  header,
  footer,
  children,
  className,
  innerClassName,
  bodyClassName = "pb-[8mm]",
  horizontalPaddingClassName = "px-[8mm]",
  topPaddingClassName = "pt-[8mm]",
  bottomPaddingClassName = "pb-[8mm]",
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  bodyClassName?: string;
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
}) {
  return (
    <article
      className={cn(
        "print-page print-document-frame bg-white text-[11px] text-slate-900",
        className,
      )}
    >
      <div className={cn("print-page-inner", innerClassName)}>
        <div
          className={cn(
            "print-header print-document-header shrink-0",
            horizontalPaddingClassName,
            topPaddingClassName,
          )}
        >
          {header}
        </div>
        <div
          className={cn(
            "print-body print-document-body min-h-0 flex-1",
            horizontalPaddingClassName,
            bodyClassName,
          )}
        >
          {children}
        </div>
        <div
          className={cn(
            "print-footer print-document-footer shrink-0",
            horizontalPaddingClassName,
            bottomPaddingClassName,
          )}
        >
          {footer}
        </div>
      </div>
    </article>
  );
}

export function PrintDocumentLayout(props: ComponentProps<typeof PrintPage>) {
  return <PrintPage {...props} />;
}
