import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { VehicleRowActions } from "@/features/vehicles/components/vehicle-row-actions";
import { listVehicles } from "@/features/vehicles/queries/vehicle-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type VehiclesPageProps = {
  searchParams: Promise<{
    search?: string;
    customerId?: string;
    error?: string;
  }>;
};

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const { search = "", customerId, error } = await searchParams;
  const [vehicles, customerOptions, session] = await Promise.all([
    listVehicles({ search, customerId }),
    listCustomerOptions(),
    requireAuthenticatedStaff(),
  ]);
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
        description={`${vehicles.length} vehicle record${vehicles.length === 1 ? "" : "s"} matched.`}
        toolbar={
          <form>
            <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
              <SearchInput
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search make, model, plate number, or VIN"
              />
              <NativeSelect name="customerId" defaultValue={customerId ?? ""}>
                <option value="">All customers</option>
                {customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/vehicles">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >
        {vehicles.length === 0 ? (
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
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.variant ?? "No variant"} · {vehicle.year ? String(vehicle.year) : "Year not set"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${vehicle.customerId}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {vehicle.customerName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{vehicle.plateNumber ?? "No plate number"}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.vin ?? "No VIN"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{vehicle.transmission ?? "No transmission"}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.fuelType ?? "No fuel type"}
                        </p>
                        <p className="text-xs text-muted-foreground">Engine size {vehicle.engineSize ?? "Not set"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>Mileage {formatMileage(vehicle.mileage)}</p>
                        <p className="text-xs text-muted-foreground">Color {vehicle.color ?? "Not set"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={vehicle.status === "active" ? "success" : "neutral"}>
                        {vehicle.status}
                      </StatusBadge>
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
