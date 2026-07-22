import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobOrderRowActions } from "@/features/job-orders/components/job-order-row-actions";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { listJobOrders } from "@/features/job-orders/queries/job-order-queries";
import type { JobOrderStatus } from "@/features/job-orders/types";
import { canDeleteJobOrdersByRole, getSimplifiedJobOrderStatus } from "@/features/job-orders/utils";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type JobOrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: JobOrderStatus | "";
    page?: string;
    error?: string;
  }>;
};

export default async function JobOrdersPage({ searchParams }: JobOrdersPageProps) {
  const { search = "", status: rawStatus = "", page, error } = await searchParams;
  const status = rawStatus ? getSimplifiedJobOrderStatus(rawStatus) : "";
  const [jobOrders, session] = await Promise.all([
    listJobOrders({ search, status }),
    requireAuthenticatedStaff(),
  ]);
  const canDeleteJobOrders = canDeleteJobOrdersByRole(session.role);
  const pagination = paginateItems(jobOrders, page);

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

      <FormStatusMessage message={error} />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px]"
            search={{
              value: search,
              placeholder: "Search job order number",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "in_progress", label: "In progress" },
                  { value: "completed", label: "Completed" },
                  { value: "released", label: "Released" },
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
            title="No job orders found"
            description="Approved quotations create the operational job-order queue."
            action={
              <Button asChild>
                <Link href="/quotations">Go to quotations</Link>
              </Button>
            }
          />
        ) : (
          <DataTableScroll>
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
                {pagination.items.map((jobOrder) => (
                  <TableRow key={jobOrder.id}>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="font-semibold text-foreground">
                        {jobOrder.jobOrderNumber}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {jobOrder.quotationNumber ?? "Manual flow"}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {jobOrder.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {jobOrder.vehicleLabel}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`}>
                        <JobOrderStatusBadge status={jobOrder.status} />
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {jobOrder.pendingApprovalCount > 0
                          ? `${jobOrder.pendingApprovalCount} · ${formatCurrency(jobOrder.pendingApprovalTotal)}`
                          : "None"}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {formatCurrency(jobOrder.billableTotal)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/job-orders/${jobOrder.id}`} className="text-foreground">
                        {jobOrder.startedAt ? formatDateTime(jobOrder.startedAt) : formatDate(jobOrder.createdAt)}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <JobOrderRowActions
                        jobOrderId={jobOrder.id}
                        jobOrderNumber={jobOrder.jobOrderNumber}
                        canDelete={canDeleteJobOrders && jobOrder.canDelete}
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
