import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ReportPage({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="report-preview-shell px-4 py-5 sm:px-6">
      {toolbar ? <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-center">{toolbar}</div> : null}
      <div className={cn("report-print-page print-page", className)}>{children}</div>
    </div>
  );
}
