import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentMethodBreakdownItem } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";

export function PaymentMethodMix({
  items,
}: {
  items: PaymentMethodBreakdownItem[];
}) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Payment method mix</CardTitle>
        <CardDescription>
          Period-based payment distribution from actual collected payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments have been collected in the selected window.</p>
        ) : (
          items.map((item) => {
            const percent = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.count} payment record{item.count === 1 ? "" : "s"}</p>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percent, 4)}%` }} />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
