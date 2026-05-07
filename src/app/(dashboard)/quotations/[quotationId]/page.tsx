import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import {
  approveQuotationAction,
  rejectQuotationAction,
} from "@/features/quotations/actions/quotation-actions";
import {
  QuotationStatusBadge,
  formatQuotationStatus,
} from "@/features/quotations/components/quotation-status-badge";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type QuotationDetailPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { quotationId } = await params;
  const quotation = await getQuotationById(quotationId);

  if (!quotation) {
    notFound();
  }

  const canApprove = quotation.status === "draft" || quotation.status === "pending_approval";
  const canEdit = quotation.status !== "approved";

  return (
    <div className="space-y-6">
      <PageHeader
        title={quotation.quotationNumber}
        description="Quotation header, commercial totals, and quoted line items."
        actions={
          <>
            {canEdit ? (
              <Button asChild variant="outline">
                <Link href={`/quotations/${quotation.id}/edit`}>Edit quotation</Link>
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <form action={approveQuotationAction}>
                  <input type="hidden" name="quotationId" value={quotation.id} />
                  <Button type="submit">Approve and create job order</Button>
                </form>
                <form action={rejectQuotationAction}>
                  <input type="hidden" name="quotationId" value={quotation.id} />
                  <Button type="submit" variant="ghost">
                    Reject quotation
                  </Button>
                </form>
              </>
            ) : null}
          </>
        }
      />

      <DetailSummaryGrid>
        <DetailSummaryItem
          label="Customer"
          value={quotation.customerName}
          hint={quotation.vehicleLabel}
        />
        <DetailSummaryItem
          label="Quotation status"
          value={formatQuotationStatus(quotation.status)}
          hint={quotation.approvedAt ? `Approved ${formatDateTime(quotation.approvedAt)}` : `Created ${formatDate(quotation.createdAt)}`}
          badge={<QuotationStatusBadge status={quotation.status} />}
        />
        <DetailSummaryItem
          label="Job order"
          value={quotation.jobOrderNumber ?? "Not created"}
          hint="Created only after quotation approval."
        />
        <DetailSummaryItem
          label="Quoted items"
          value={`${quotation.items.length} line item${quotation.items.length === 1 ? "" : "s"}`}
          hint={`Subtotal ${formatCurrency(quotation.subtotal)}`}
        />
        <DetailSummaryItem
          label="Commercial adjustments"
          value={`${formatCurrency(quotation.discount)} discount`}
          hint={`${formatCurrency(quotation.tax)} tax`}
        />
        <DetailSummaryItem
          label="Total estimate"
          value={formatCurrency(quotation.totalAmount)}
          hint={quotation.inspectionNotes ?? "No inspection notes"}
        />
      </DetailSummaryGrid>

      <SectionCard
        title="Estimate items"
        description="The final invoice should come from actual job-order items, not directly from this list."
        contentClassName="space-y-4"
      >
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.lineNumber}</TableCell>
                  <TableCell className="capitalize">{item.itemType}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <TotalRow label="Subtotal" value={formatCurrency(quotation.subtotal)} />
          <TotalRow label="Discount" value={formatCurrency(quotation.discount)} />
          <TotalRow label="Tax" value={formatCurrency(quotation.tax)} />
          <TotalRow label="Total estimate" value={formatCurrency(quotation.totalAmount)} emphasized />
        </div>
      </SectionCard>
    </div>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/70 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
