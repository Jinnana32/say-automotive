import Link from "next/link";
import { Eye } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { IconActionLink } from "@/components/shared/icon-action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerDocumentHistoryItem } from "@/features/customers/types";
import { InvoiceStatusBadge, PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function DocumentHistoryTable({
  entries,
  showVehicleColumn = true,
  emptyDescription = "Quotations, job orders, invoices, and payments will appear here as work moves through the shop.",
}: {
  entries: CustomerDocumentHistoryItem[];
  showVehicleColumn?: boolean;
  emptyDescription?: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Document</TableHead>
            {showVehicleColumn ? <TableHead>Vehicle</TableHead> : null}
            <TableHead>Status / method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Linked records</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={`${entry.documentType}-${entry.id}`}>
              <TableCell className="whitespace-nowrap">{formatDate(entry.occurredAt)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    {formatDocumentType(entry.documentType)}
                  </p>
                  <Link href={entry.documentHref} className="font-semibold underline-offset-4 hover:underline">
                    {entry.documentLabel}
                  </Link>
                </div>
              </TableCell>
              {showVehicleColumn ? <TableCell>{entry.vehicleLabel ?? "No vehicle"}</TableCell> : null}
              <TableCell>{renderDocumentStatus(entry)}</TableCell>
              <TableCell>{entry.amount === null ? "—" : formatCurrency(entry.amount)}</TableCell>
              <TableCell>
                {entry.linkedRecords.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No linked records</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entry.linkedRecords.map((record) => (
                      <Link
                        key={`${entry.id}-${record.href}`}
                        href={record.href}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        {record.label}
                      </Link>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell className="w-14 text-right">
                <IconActionLink
                  href={entry.documentHref}
                  label={`Open document ${entry.documentLabel}`}
                  icon={Eye}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDocumentType(value: CustomerDocumentHistoryItem["documentType"]) {
  return value.replaceAll("_", " ");
}

function renderDocumentStatus(entry: CustomerDocumentHistoryItem) {
  if (entry.documentType === "quotation") {
    return <QuotationStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "job_order") {
    return <JobOrderStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "invoice") {
    return <InvoiceStatusBadge status={entry.status} />;
  }

  return <PaymentMethodBadge method={entry.paymentMethod} />;
}
