import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { formatCurrency } from "@/lib/currency";
import { listServices } from "@/features/services/queries/service-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { search = "", page } = await searchParams;
  const services = await listServices(search);
  const pagination = paginateItems(services, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Maintain labor and service catalog entries that will feed quotations, job orders, and invoices."
        actions={
          <Button asChild>
            <Link href="/services/new">New service</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Service catalog"
        description={`${pagination.totalItems} service${pagination.totalItems === 1 ? "" : "s"} matched.`}
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: "Search by service name or category",
            }}
          />
        }
        contentClassName="p-0"
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
              title="No services found"
              description="Create service catalog entries before assembling quotations or billing labor."
              action={
                <Button asChild>
                  <Link href="/services/new">Create service</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Labor price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.items.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.description ?? "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{service.category ?? "Uncategorized"}</TableCell>
                      <TableCell>{formatCurrency(service.laborPrice)}</TableCell>
                      <TableCell>
                        {service.estimatedDurationMinutes
                          ? `${service.estimatedDurationMinutes} min`
                          : "Not set"}
                      </TableCell>
                      <TableCell className="capitalize">{service.status}</TableCell>
                      <TableCell className="text-right">
                        <TableRowActionsMenu label={`Service actions for ${service.name}`}>
                          <TableRowActionsMenuLink
                            href={`/services/${service.id}/edit`}
                            label="Edit service"
                          />
                        </TableRowActionsMenu>
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
