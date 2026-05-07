import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  description,
  badge,
  icon: Icon,
  tone = "default",
  className,
}: {
  title: string;
  value: string;
  description?: string;
  badge?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "info" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          {Icon ? (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Icon className="size-5" />
            </div>
          ) : null}
        </div>
        {description || badge ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : <span />}
            {badge ? <StatusBadge tone={tone}>{badge}</StatusBadge> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
