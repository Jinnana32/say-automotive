import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopPerformerItem } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";

export function TopItemsPanel({
  title,
  description,
  items,
  quantityLabel,
}: {
  title: string;
  description: string;
  items: TopPerformerItem[];
  quantityLabel: string;
}) {
  const maxAmount = Math.max(...items.map((item) => item.amount), 0);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching records in the selected period.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {trimNumeric(item.quantity)} {quantityLabel}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground">{formatCurrency(item.amount)}</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${maxAmount > 0 ? Math.max((item.amount / maxAmount) * 100, 6) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function trimNumeric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
