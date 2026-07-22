import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { VehicleRowActions } from "@/features/vehicles/components/vehicle-row-actions";
import { listVehicles } from "@/features/vehicles/queries/vehicle-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string;
    customerId?: string;
    page?: string;
    error?: string;
  }>;
};

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const { search = "", customerId, page, error } = await searchParams;
  const [vehicles, customerOptions, session] = await Promise.all([
    listVehicles({ search, customerId }),
    listCustomerOptions(),
    requireAuthenticatedStaff(),
  ]);
  const pagination = paginateItems(vehicles, page);
  const canManageVehicles = session.capabilities.includes("vehicles:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Vehicle records linked to customers and operational documents."
        actions={canManageVehicles ? (
          <Button asChild>
            <Link href="/vehicles/new">New vehicle</Link>
          </Button>
        ) : null}
      />

      <FormStatusMessage message={error} />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}:${customerId ?? ""}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search make, model, plate number, or VIN",
            }}
            filters={[
              {
                type: "select",
                name: "customerId",
                value: customerId ?? "",
                options: [
                  { value: "", label: "All customers" },
                  ...customerOptions.map((option) => ({
                    value: option.id,
                    label: option.label,
                  })),
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
            title="No vehicles found"
            description="Add a vehicle after the customer exists so workshop documents can reference a real unit."
            action={
              <Button asChild>
                <Link href="/vehicles/new">Create vehicle</Link>
              </Button>
            }
          />
        ) : (
          <DataTableScroll minWidthClassName="min-w-[64rem]">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Vehicle</TableHead>
                  <TableHead className="w-[18%]">Customer</TableHead>
                  <TableHead className="w-[14%]">Plate</TableHead>
                  <TableHead className="w-[18%]">Details</TableHead>
                  <TableHead className="w-[14%]">Operational</TableHead>
                  <TableHead className="w-[8%]">Status</TableHead>
                  {canManageVehicles ? <TableHead className="w-14 text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((vehicle) => {
                  const detailLine = [
                    vehicle.transmission,
                    vehicle.fuelType,
                    vehicle.engineSize ? `Engine ${vehicle.engineSize}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const operationalLine = [
                    vehicle.mileage !== null ? formatMileage(vehicle.mileage) : null,
                    vehicle.color ? vehicle.color : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <TableCellLink href={`/vehicles/${vehicle.id}`}>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[vehicle.variant, vehicle.year ? String(vehicle.year) : null]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink
                          href={`/vehicles/${vehicle.id}`}
                          className="block truncate font-medium text-foreground"
                        >
                          {vehicle.customerName}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/vehicles/${vehicle.id}`}>
                          <div className="min-w-0 space-y-1 text-sm">
                            <p className="truncate font-medium text-foreground">
                              {vehicle.plateNumber ?? "—"}
                            </p>
                            {vehicle.vin ? (
                              <p className="truncate text-xs text-muted-foreground">{vehicle.vin}</p>
                            ) : null}
                          </div>
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink
                          href={`/vehicles/${vehicle.id}`}
                          className="block truncate text-sm text-foreground"
                        >
                          {detailLine || "—"}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink
                          href={`/vehicles/${vehicle.id}`}
                          className="block truncate text-sm text-foreground"
                        >
                          {operationalLine || "—"}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/vehicles/${vehicle.id}`}>
                          <StatusBadge tone={vehicle.status === "active" ? "success" : "neutral"}>
                            {vehicle.status}
                          </StatusBadge>
                        </TableCellLink>
                      </TableCell>
                      {canManageVehicles ? (
                        <TableCell className="w-14 text-right">
                          <VehicleRowActions
                            vehicleId={vehicle.id}
                            vehicleLabel={`${vehicle.make} ${vehicle.model}${vehicle.plateNumber ? ` (${vehicle.plateNumber})` : ""}`}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}

function formatMileage(value: number | null) {
  return value !== null ? `${value.toLocaleString()} km` : null;
}
