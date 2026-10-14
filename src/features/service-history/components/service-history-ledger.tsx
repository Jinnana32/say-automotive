"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { ServiceHistoryItemDetails } from "@/features/service-history/components/service-history-item-details";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import {
  listServiceHistoryTaskLabels,
  serviceHistoryEntryMatchesQuery,
  sortServiceHistoryEntries,
  splitServiceHistoryEntries,
} from "@/features/service-history/utils";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ServiceHistoryLedger({
  entries,
  showVehicleLabel = false,
}: {
  entries: ServiceHistoryEntry[];
  showVehicleLabel?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filteredEntries = useMemo(
    () =>
      sortServiceHistoryEntries(entries).filter((entry) =>
        serviceHistoryEntryMatchesQuery(entry, query),
      ),
    [entries, query],
  );
  const { active, history } = splitServiceHistoryEntries(filteredEntries);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-5">
      <SearchInput
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search service tasks"
        aria-label="Search service tasks"
        className="max-w-sm"
      />

      {active.length === 0 && history.length === 0 ? (
        <EmptyState
          title={hasQuery ? "No matching service records" : "No service history yet"}
          description={
            hasQuery
              ? "Try another task name or job order number."
              : "Completed or released job orders for this vehicle will appear here."
          }
        />
      ) : (
        <div className="space-y-5">
          {active.length > 0 ? (
            <section className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">In progress</h3>
                <p className="text-sm text-muted-foreground">
                  Current workshop records that are still open.
                </p>
              </div>
              <ServiceHistoryTable
                entries={active}
                expandedId={expandedId}
                onToggle={setExpandedId}
                showVehicleLabel={showVehicleLabel}
              />
            </section>
          ) : null}

          <section className="space-y-3">
            {active.length > 0 ? (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Completed</h3>
                <p className="text-sm text-muted-foreground">Newest completed visits first.</p>
              </div>
            ) : null}
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {hasQuery
                  ? "No completed records match that search."
                  : "No completed service records yet."}
              </p>
            ) : (
              <ServiceHistoryTable
                entries={history}
                expandedId={expandedId}
                onToggle={setExpandedId}
                showVehicleLabel={showVehicleLabel}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ServiceHistoryTable({
  entries,
  expandedId,
  onToggle,
  showVehicleLabel,
}: {
  entries: ServiceHistoryEntry[];
  expandedId: string | null;
  onToggle: (entryId: string | null) => void;
  showVehicleLabel: boolean;
}) {
  const columnCount = showVehicleLabel ? 6 : 5;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Job order</TableHead>
            {showVehicleLabel ? <TableHead>Vehicle</TableHead> : null}
            <TableHead>Mileage</TableHead>
            <TableHead>Service tasks</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const taskLabels = listServiceHistoryTaskLabels(entry);

            return (
              <ServiceHistoryRows
                key={entry.id}
                entry={entry}
                taskLabels={taskLabels}
                isExpanded={isExpanded}
                columnCount={columnCount}
                showVehicleLabel={showVehicleLabel}
                onToggle={() => onToggle(isExpanded ? null : entry.id)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ServiceHistoryRows({
  entry,
  taskLabels,
  isExpanded,
  columnCount,
  showVehicleLabel,
  onToggle,
}: {
  entry: ServiceHistoryEntry;
  taskLabels: string[];
  isExpanded: boolean;
  columnCount: number;
  showVehicleLabel: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        data-state={isExpanded ? "selected" : undefined}
        className="cursor-pointer"
        onClick={onToggle}
      >
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDate(entry.serviceDate)}
        </TableCell>
        <TableCell>
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                entry.phase === "active" ? "bg-amber-500" : "bg-emerald-600",
              )}
              aria-hidden
            />
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/job-orders/${entry.jobOrderId}`}
                  className="font-semibold text-foreground underline decoration-foreground/35 underline-offset-4 hover:decoration-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  {entry.jobOrderNumber}
                </Link>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Hide details for ${entry.jobOrderNumber}`
                      : `Show details for ${entry.jobOrderNumber}`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                >
                  <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <JobOrderStatusBadge status={entry.status} />
                {entry.isHistorical ? <Badge variant="secondary">Historical</Badge> : null}
              </div>
            </div>
          </div>
        </TableCell>
        {showVehicleLabel ? (
          <TableCell className="text-sm text-foreground">{entry.vehicleLabel}</TableCell>
        ) : null}
        <TableCell className="whitespace-nowrap">{formatHistoryMileage(entry)}</TableCell>
        <TableCell>
          {taskLabels.length === 0 ? (
            <span className="text-sm text-muted-foreground">No tasks recorded</span>
          ) : (
            <ul className="space-y-1">
              {taskLabels.map((label, index) => (
                <li
                  key={`${entry.id}-${index}-${label}`}
                  className="text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4"
                >
                  {label}
                </li>
              ))}
            </ul>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground">{formatCurrency(entry.totalAmount)}</p>
            {entry.invoice ? (
              <div className="flex justify-end">
                <InvoiceStatusBadge status={entry.invoice.status} />
              </div>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount} className="bg-muted/25 px-4 py-4">
            <ServiceHistoryItemDetails entry={entry} />
            <div className="pt-3">
              <Link
                href={`/job-orders/${entry.jobOrderId}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open full job order
              </Link>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function formatHistoryMileage(entry: ServiceHistoryEntry) {
  if (entry.mileageIn !== null) {
    return `${entry.mileageIn.toLocaleString()} km`;
  }

  if (entry.mileageOut !== null) {
    return `${entry.mileageOut.toLocaleString()} km`;
  }

  return "—";
}
