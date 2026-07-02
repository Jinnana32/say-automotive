import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { ServiceHistoryItemDetails } from "@/features/service-history/components/service-history-item-details";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { buildServiceHistorySummary } from "@/features/service-history/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function ServiceHistoryCard({
  entry,
  showVehicleLabel = false,
}: {
  entry: ServiceHistoryEntry;
  showVehicleLabel?: boolean;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{formatDate(entry.serviceDate)}</p>
              <JobOrderStatusBadge status={entry.status} />
              {entry.isHistorical ? <Badge variant="secondary">Historical record</Badge> : null}
              {showVehicleLabel ? <Badge variant="outline">{entry.vehicleLabel}</Badge> : null}
            </div>
            <div className="space-y-1">
              <Link
                href={`/job-orders/${entry.jobOrderId}`}
                className="text-lg font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {entry.jobOrderNumber}
              </Link>
              <p className="text-sm text-muted-foreground">{buildServiceHistorySummary(entry)}</p>
            </div>
          </div>
          <div className="space-y-1 text-left md:text-right">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Total amount
            </p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(entry.totalAmount)}</p>
          </div>
        </div>

        <ServiceHistoryItemDetails entry={entry} />
      </CardContent>
    </Card>
  );
}
