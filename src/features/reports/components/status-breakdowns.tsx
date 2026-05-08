import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusBreakdownItem } from "@/features/reports/types";

export function StatusBreakdowns({
  quotationStatuses,
  periodJobOrderStatuses,
  liveJobOrderStatuses,
}: {
  quotationStatuses: StatusBreakdownItem[];
  periodJobOrderStatuses: StatusBreakdownItem[];
  liveJobOrderStatuses: StatusBreakdownItem[];
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Status breakdowns</CardTitle>
        <CardDescription>
          Period quotation and job-order movement, plus the current live job-order mix.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-3">
        <BreakdownGroup
          title="Quotations in period"
          items={quotationStatuses}
          emptyLabel="No quotations in this window."
        />
        <BreakdownGroup
          title="Job orders in period"
          items={periodJobOrderStatuses}
          emptyLabel="No job orders opened in this window."
        />
        <BreakdownGroup
          title="Live job orders"
          items={liveJobOrderStatuses}
          emptyLabel="No active job orders found."
        />
      </CardContent>
    </Card>
  );
}

function BreakdownGroup({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: StatusBreakdownItem[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
          >
            <p className="capitalize text-sm text-muted-foreground">{item.label}</p>
            <p className="font-medium text-foreground">{item.count}</p>
          </div>
        ))
      )}
    </div>
  );
}
