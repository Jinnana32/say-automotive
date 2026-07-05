import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { IconActionLink } from "@/components/shared/icon-action";
import { PageHeader } from "@/components/shared/page-header";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { listInvoices } from "@/features/invoices/queries/invoice-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type InvoicesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "unpaid" | "partially_paid" | "paid" | "cancelled";
    page?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const { search = "", status = "", page } = await searchParams;
  const invoices = await listInvoices({ search, status });
  const pagination = paginateItems(invoices, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Billing records used for payment collection and release control."
        actions={
          <Button asChild variant="outline">
            <Link href="/job-orders">Review job orders</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Invoice register"
        description={`${pagination.totalItems} invoice${pagination.totalItems === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search invoice number",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "unpaid", label: "Unpaid" },
                  { value: "partially_paid", label: "Partially paid" },
                  { value: "paid", label: "Paid" },
                  { value: "cancelled", label: "Cancelled" },
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
            title="No invoices found"
            description="Invoices are generated after a job order reaches ready for billing."
            action={
              <Button asChild>
                <Link href="/job-orders">Go to job orders</Link>
              </Button>
            }
          />
        ) : (
          <DataTableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Job order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="font-semibold text-foreground">
                        {invoice.invoiceNumber}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.jobOrderNumber ?? "POS flow"}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {invoice.vehicleLabel}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`}>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatCurrency(invoice.balance)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/invoices/${invoice.id}`} className="text-foreground">
                        {formatDate(invoice.invoiceDate)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <IconActionLink
                        href={`/invoices/${invoice.id}`}
                        label={`Open invoice ${invoice.invoiceNumber}`}
                        icon={Eye}
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
