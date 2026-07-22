import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DataTableCard({
  action,
  toolbar,
  footer,
  children,
  className,
  contentClassName,
}: {
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {toolbar || action ? (
        <div
          className={cn(
            "border-b border-border/70 p-3 sm:p-4",
            toolbar && action
              ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : null,
          )}
        >
          {toolbar ? <div className="min-w-0 flex-1">{toolbar}</div> : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <CardContent className={cn("p-3 sm:p-4", contentClassName)}>{children}</CardContent>
      {footer}
    </Card>
  );
}
