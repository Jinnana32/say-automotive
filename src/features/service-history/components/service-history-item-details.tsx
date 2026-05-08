import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { ServiceHistoryEntry, ServiceHistoryLineItem } from "@/features/service-history/types";
import { formatCurrency } from "@/lib/currency";

export function ServiceHistoryItemDetails({ entry }: { entry: ServiceHistoryEntry }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <HistoryNarrative label="Concern" value={entry.customerConcern} />
        <HistoryNarrative label="Inspection notes" value={entry.inspectionNotes} />
        <HistoryNarrative label="Diagnosis" value={entry.diagnosis} />
        <HistoryNarrative label="Work performed" value={entry.workPerformed} />
        <HistoryNarrative
          label="Mileage"
          value={formatMileageRange(entry.mileageIn, entry.mileageOut)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HistoryList label="Services" items={entry.services} emptyLabel="No services or labor recorded." />
        <HistoryList label="Parts used" items={entry.partsUsed} emptyLabel="No parts usage recorded." />
      </div>

      {entry.rejectedExtras.length > 0 ? (
        <HistoryList
          label="Rejected extras"
          items={entry.rejectedExtras}
          emptyLabel=""
          muted
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <HistoryNarrative
          label="Mechanics"
          value={
            entry.mechanics.length > 0
              ? entry.mechanics
                  .map((mechanic) =>
                    mechanic.taskDescription
                      ? `${mechanic.fullName} (${mechanic.taskDescription})`
                      : mechanic.fullName,
                  )
                  .join(", ")
              : "No mechanics assigned."
          }
        />
        <HistoryLinkedRecord
          label="Invoice"
          content={
            entry.invoice ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/invoices/${entry.invoice.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {entry.invoice.invoiceNumber}
                  </Link>
                  <InvoiceStatusBadge status={entry.invoice.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Paid {formatCurrency(entry.invoice.paidAmount)} of{" "}
                  {formatCurrency(entry.invoice.totalAmount)}
                </p>
              </div>
            ) : (
              "No invoice linked."
            )
          }
        />
        <HistoryLinkedRecord
          label="Quotation"
          content={
            entry.quotation ? (
              <Link
                href={`/quotations/${entry.quotation.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {entry.quotation.quotationNumber}
              </Link>
            ) : (
              "No quotation source linked."
            )
          }
        />
      </div>
    </div>
  );
}

function HistoryNarrative({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value?.trim() || "No details recorded."}</p>
    </div>
  );
}

function HistoryLinkedRecord({
  label,
  content,
}: {
  label: string;
  content: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="text-sm leading-6 text-foreground">{content}</div>
    </div>
  );
}

function HistoryList({
  label,
  items,
  emptyLabel,
  muted = false,
}: {
  label: string;
  items: ServiceHistoryLineItem[];
  emptyLabel: string;
  muted?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item.id}
              variant={muted ? "outline" : "secondary"}
              className="whitespace-normal px-3 py-1 text-left leading-5"
            >
              {item.label}
              {" · "}
              {formatQuantity(item.quantity)}
              {item.isAdditional ? " · Extra" : ""}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMileageRange(mileageIn: number | null, mileageOut: number | null) {
  if (mileageIn === null && mileageOut === null) {
    return "No mileage recorded.";
  }

  if (mileageIn !== null && mileageOut !== null) {
    return `${mileageIn.toLocaleString()} km in · ${mileageOut.toLocaleString()} km out`;
  }

  if (mileageIn !== null) {
    return `${mileageIn.toLocaleString()} km in`;
  }

  return `${mileageOut?.toLocaleString()} km out`;
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? `Qty ${value}` : `Qty ${value.toFixed(2)}`;
}
