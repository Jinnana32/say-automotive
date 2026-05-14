import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
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
        title="Vehicle registry"
        description={`${pagination.totalItems} vehicle record${pagination.totalItems === 1 ? "" : "s"} matched.`}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plate / VIN</TableHead>
                  <TableHead>Specs</TableHead>
                  <TableHead>Operational</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageVehicles ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <TableCellLink href={`/vehicles/${vehicle.id}`}>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.variant ?? "No variant"} · {vehicle.year ? String(vehicle.year) : "Year not set"}
                          </p>
                        </div>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/vehicles/${vehicle.id}`} className="font-medium text-foreground">
                        {vehicle.customerName}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/vehicles/${vehicle.id}`}>
                        <div className="space-y-1 text-sm">
                          <p>{vehicle.plateNumber ?? "No plate number"}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.vin ?? "No VIN"}</p>
                        </div>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/vehicles/${vehicle.id}`}>
                        <div className="space-y-1 text-sm">
                          <p>{vehicle.transmission ?? "No transmission"}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.fuelType ?? "No fuel type"}
                          </p>
                          <p className="text-xs text-muted-foreground">Engine size {vehicle.engineSize ?? "Not set"}</p>
                        </div>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/vehicles/${vehicle.id}`}>
                        <div className="space-y-1 text-sm">
                          <p>Mileage {formatMileage(vehicle.mileage)}</p>
                          <p className="text-xs text-muted-foreground">Color {vehicle.color ?? "Not set"}</p>
                        </div>
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
                      <TableCell className="text-right">
                        <VehicleRowActions
                          vehicleId={vehicle.id}
                          vehicleLabel={`${vehicle.make} ${vehicle.model}${vehicle.plateNumber ? ` (${vehicle.plateNumber})` : ""}`}
                        />
                      </TableCell>
                    ) : null}
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

function formatMileage(value: number | null) {
  return value !== null ? `${value.toLocaleString()} km` : "Not set";
}
