import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { listWebsiteQuoteRequests } from "@/features/website/queries/website-queries";
import { getWebsiteQuoteRequestTone } from "@/features/website/utils";
import { WebsiteQuoteRequestRowActions } from "@/features/website/components/website-quote-request-row-actions";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type WebsiteQuoteRequestsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "new" | "reviewed" | "contacted" | "quoted" | "closed";
    page?: string;
  }>;
};

export default async function WebsiteQuoteRequestsPage({
  searchParams,
}: WebsiteQuoteRequestsPageProps) {
  const { search = "", status = "", page } = await searchParams;
  const requests = await listWebsiteQuoteRequests({ search, status });
  const pagination = paginateItems(requests, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Quote Requests"
        description="Public-site quote leads collected before an internal quotation is prepared."
        actions={
          <Button asChild variant="outline">
            <Link href="/quotations">Back to quotations</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Lead queue"
        description={`${pagination.totalItems} request${pagination.totalItems === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search customer, email, vehicle, city, or service",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "new", label: "New" },
                  { value: "reviewed", label: "Reviewed" },
                  { value: "contacted", label: "Contacted" },
                  { value: "quoted", label: "Quoted" },
                  { value: "closed", label: "Closed" },
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
            title="No website quote requests"
            description="Public quote requests will appear here once the website form is live."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {request.firstName} {request.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.contactNumber ?? "No phone"} · {request.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {request.vehicleMake} {request.vehicleModel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.vehicleYear ?? "Year n/a"} · {request.transmission} ·{" "}
                          {request.mileage}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{request.serviceNeeded}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requestedProductLabel
                            ? `Catalog reference: ${request.requestedProductLabel}`
                            : request.customerConcern}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{request.city}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.barangay}, {request.province}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={getWebsiteQuoteRequestTone(request.status)}>
                        {request.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <WebsiteQuoteRequestRowActions
                        requestId={request.id}
                        currentStatus={request.status}
                      />
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
