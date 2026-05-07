import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { listJobOrders } from "@/features/job-orders/queries/job-order-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type JobOrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?:
      | "pending"
      | "in_progress"
      | "waiting_for_parts"
      | "waiting_for_customer_approval"
      | "completed"
      | "ready_for_billing"
      | "paid"
      | "released"
      | "cancelled";
  }>;
};

export default async function JobOrdersPage({ searchParams }: JobOrdersPageProps) {
  const { search = "", status = "" } = await searchParams;
  const jobOrders = await listJobOrders({ search, status });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Orders"
        description="Live operational work after quotation approval."
        actions={
          <Button asChild variant="outline">
            <Link href="/quotations">Review quotations</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Job order board"
        description={`${jobOrders.length} job order${jobOrders.length === 1 ? "" : "s"} in the current queue.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px_auto_auto]">
              <SearchInput
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search job order number"
              />
              <NativeSelect name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_for_parts">Waiting for parts</option>
                <option value="waiting_for_customer_approval">Waiting for customer approval</option>
                <option value="completed">Completed</option>
                <option value="ready_for_billing">Ready for billing</option>
                <option value="paid">Paid</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/job-orders">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >

        {jobOrders.length === 0 ? (
          <EmptyState
            title="No job orders found"
            description="Approved quotations create the operational job-order queue."
            action={
              <Button asChild>
                <Link href="/quotations">Go to quotations</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job order</TableHead>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pending extras</TableHead>
                  <TableHead>Billable total</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobOrders.map((jobOrder) => (
                  <TableRow key={jobOrder.id}>
                    <TableCell className="font-semibold">{jobOrder.jobOrderNumber}</TableCell>
                    <TableCell>{jobOrder.quotationNumber ?? "Manual flow"}</TableCell>
                    <TableCell>{jobOrder.customerName}</TableCell>
                    <TableCell>{jobOrder.vehicleLabel}</TableCell>
                    <TableCell>
                      <JobOrderStatusBadge status={jobOrder.status} />
                    </TableCell>
                    <TableCell>
                      {jobOrder.pendingApprovalCount > 0
                        ? `${jobOrder.pendingApprovalCount} · ${formatCurrency(jobOrder.pendingApprovalTotal)}`
                        : "None"}
                    </TableCell>
                    <TableCell>{formatCurrency(jobOrder.billableTotal)}</TableCell>
                    <TableCell>
                      {jobOrder.startedAt ? formatDateTime(jobOrder.startedAt) : formatDate(jobOrder.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/job-orders/${jobOrder.id}`}>Open</Link>
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
