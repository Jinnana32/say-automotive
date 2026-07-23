import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { QuotationRowActions } from "@/features/quotations/components/quotation-row-actions";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { listQuotations } from "@/features/quotations/queries/quotation-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type QuotationsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "draft" | "pending_approval" | "approved" | "rejected" | "expired";
    page?: string;
  }>;
};

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const { search = "", status = "", page } = await searchParams;
  const quotations = await listQuotations({ search, status });
  const pagination = paginateItems(quotations, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Estimates before operational approval and job-order execution."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/quotations/website-requests">Website leads</Link>
            </Button>
            <Button asChild>
              <Link href="/quotations/new">New quotation</Link>
            </Button>
          </div>
        }
      />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search quotation, customer, or plate number",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "pending_approval", label: "Pending approval" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "expired", label: "Expired" },
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
          />
        }
      >

        {pagination.totalItems === 0 ? (
          <EmptyState
            title="No quotations found"
            description="Create a quotation after customer and vehicle records exist."
            action={
              <Button asChild>
                <Link href="/quotations/new">Create quotation</Link>
              </Button>
            }
          />
        ) : (
          <DataTableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="font-semibold text-foreground">
                        {quotation.quotationNumber}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {quotation.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {quotation.vehicleLabel}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`}>
                        <QuotationStatusBadge status={quotation.status} />
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {formatCurrency(quotation.totalAmount)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/quotations/${quotation.id}`} className="text-foreground">
                        {formatDate(quotation.createdAt)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <QuotationRowActions
                        quotationId={quotation.id}
                        quotationNumber={quotation.quotationNumber}
                        status={quotation.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}
