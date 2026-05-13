import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { listWebsiteQuoteRequests } from "@/features/website/queries/website-queries";
import { getWebsiteQuoteRequestTone } from "@/features/website/utils";
import { WebsiteQuoteRequestRowActions } from "@/features/website/components/website-quote-request-row-actions";

export const dynamic = "force-dynamic";

type WebsiteQuoteRequestsPageProps = {
  searchParams: Promise<{
    status?: "new" | "reviewed" | "contacted" | "quoted" | "closed";
  }>;
};

export default async function WebsiteQuoteRequestsPage({
  searchParams,
}: WebsiteQuoteRequestsPageProps) {
  const { status = "" } = await searchParams;
  const requests = await listWebsiteQuoteRequests(status);

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
        description={`${requests.length} request${requests.length === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[220px_auto_auto]">
              <NativeSelect name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="closed">Closed</option>
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/quotations/website-requests">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >
        {requests.length === 0 ? (
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
                {requests.map((request) => (
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
