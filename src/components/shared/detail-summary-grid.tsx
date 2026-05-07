import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DetailSummaryGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 xl:grid-cols-3", className)}>{children}</div>;
}

export function DetailSummaryItem({
  label,
  value,
  hint,
  badge,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70 shadow-sm", className)}>
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-base font-semibold leading-6 text-foreground">{value}</div>
            {hint ? <div className="text-sm leading-5 text-muted-foreground">{hint}</div> : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
