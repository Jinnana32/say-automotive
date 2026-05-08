import { AlertTriangle, Boxes, CircleAlert, WalletCards, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ReportMetric } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";

const ICONS = [WalletCards, Wrench, AlertTriangle, CircleAlert, Boxes] as const;

export function OperationalAlerts({
  metrics,
}: {
  metrics: ReportMetric[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, index) => {
        const Icon = ICONS[index % ICONS.length];

        return (
          <Card key={metric.label} className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {formatMetric(metric.value, metric.kind)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </div>
              {metric.helper ? (
                <p className="mt-3 text-sm leading-5 text-muted-foreground">{metric.helper}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatMetric(value: number, kind: ReportMetric["kind"]) {
  if (kind === "currency") {
    return formatCurrency(value);
  }

  if (kind === "quantity") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  }

  return String(value);
}
