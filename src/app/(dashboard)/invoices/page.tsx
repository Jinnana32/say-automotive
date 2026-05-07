import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { listInvoices } from "@/features/invoices/queries/invoice-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type InvoicesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "unpaid" | "partially_paid" | "paid" | "cancelled";
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const { search = "", status = "" } = await searchParams;
  const invoices = await listInvoices({ search, status });

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
        description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
              <SearchInput
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search invoice number"
              />
              <NativeSelect name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/invoices">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >

        {invoices.length === 0 ? (
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
          <div className="overflow-x-auto">
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
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-semibold">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.jobOrderNumber ?? "POS flow"}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.vehicleLabel}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/invoices/${invoice.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
