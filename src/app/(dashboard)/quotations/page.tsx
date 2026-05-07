import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { listQuotations } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type QuotationsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "draft" | "pending_approval" | "approved" | "rejected" | "expired";
  }>;
};

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const { search = "", status = "" } = await searchParams;
  const quotations = await listQuotations({ search, status });

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
        title="Quotation queue"
        description={`${quotations.length} quotation${quotations.length === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
              <SearchInput
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search quotation number"
              />
              <NativeSelect name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/quotations">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >

        {quotations.length === 0 ? (
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
          <div className="overflow-x-auto">
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
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-semibold">{quotation.quotationNumber}</TableCell>
                    <TableCell>{quotation.customerName}</TableCell>
                    <TableCell>{quotation.vehicleLabel}</TableCell>
                    <TableCell>
                      <QuotationStatusBadge status={quotation.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(quotation.totalAmount)}</TableCell>
                    <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/quotations/${quotation.id}`}>View</Link>
                        </Button>
                        {quotation.status === "approved" ? (
                          <StatusBadge tone="neutral">Locked</StatusBadge>
                        ) : (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/quotations/${quotation.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                      </div>
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
