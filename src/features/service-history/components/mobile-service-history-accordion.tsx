import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { ServiceHistoryItemDetails } from "@/features/service-history/components/service-history-item-details";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { buildServiceHistorySummary, splitServiceHistoryEntries } from "@/features/service-history/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function MobileServiceHistoryAccordion({
  entries,
  showVehicleLabel = false,
}: {
  entries: ServiceHistoryEntry[];
  showVehicleLabel?: boolean;
}) {
  const { active, history } = splitServiceHistoryEntries(entries);

  return (
    <div className="space-y-4">
      {active.length > 0 ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Active job</h3>
            <p className="text-sm text-muted-foreground">Current workshop records that are still in progress.</p>
          </div>
          <div className="space-y-2">
            {active.map((entry) => (
              <details
                key={entry.id}
                className="rounded-2xl border border-border/70 bg-background p-4"
              >
                <summary className="cursor-pointer list-none space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">{formatDate(entry.serviceDate)}</p>
                    <JobOrderStatusBadge status={entry.status} />
                    {showVehicleLabel ? <Badge variant="outline">{entry.vehicleLabel}</Badge> : null}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{entry.jobOrderNumber}</p>
                    <p className="text-sm text-muted-foreground">{buildServiceHistorySummary(entry)}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(entry.totalAmount)}
                  </p>
                </summary>
                <div className="pt-4">
                  <ServiceHistoryItemDetails entry={entry} />
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Completed history</h3>
          <p className="text-sm text-muted-foreground">Newest completed or released service records first.</p>
        </div>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
            No service history yet. Completed or released job orders for this vehicle will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <details
                key={entry.id}
                className="rounded-2xl border border-border/70 bg-background p-4"
              >
                <summary className="cursor-pointer list-none space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">{formatDate(entry.serviceDate)}</p>
                    <JobOrderStatusBadge status={entry.status} />
                    {showVehicleLabel ? <Badge variant="outline">{entry.vehicleLabel}</Badge> : null}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{entry.jobOrderNumber}</p>
                    <p className="text-sm text-muted-foreground">{buildServiceHistorySummary(entry)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(entry.totalAmount)}
                    </p>
                    {entry.invoice ? <InvoiceStatusBadge status={entry.invoice.status} /> : null}
                  </div>
                </summary>
                <div className="pt-4">
                  <ServiceHistoryItemDetails entry={entry} />
                  <div className="pt-3">
                    <Link
                      href={`/job-orders/${entry.jobOrderId}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open full job order
                    </Link>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
