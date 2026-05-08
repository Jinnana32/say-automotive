import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VehicleServiceHistory } from "@/features/service-history/components/vehicle-service-history";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import { getVehicleById } from "@/features/vehicles/queries/vehicle-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
};

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const session = await requireAuthenticatedStaff();
  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  const canManageVehicles = session.capabilities.includes("vehicles:write");
  const canViewServiceHistory = session.capabilities.includes("job_orders:read");
  const serviceHistory = canViewServiceHistory
    ? await listServiceHistoryByVehicleIds([vehicle.id])
    : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Service Desk" },
          { label: "Vehicles", href: "/vehicles" },
          { label: `${vehicle.make} ${vehicle.model}` },
        ]}
      />

      <PageHeader
        title={`${vehicle.make} ${vehicle.model}${vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""}`}
        description="Vehicle profile, linked customer, and service history derived from actual job orders."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/customers/${vehicle.customerId}`}>View customer</Link>
            </Button>
            {canManageVehicles ? (
              <Button asChild>
                <Link href={`/vehicles/${vehicle.id}/edit`}>Edit vehicle</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <DetailSummaryGrid>
        <DetailSummaryItem
          label="Linked customer"
          value={vehicle.customerName}
          hint="Customer account currently attached to this vehicle."
        />
        <DetailSummaryItem
          label="Plate / VIN"
          value={vehicle.plateNumber ?? "No plate number"}
          hint={vehicle.vin ?? "No VIN on file"}
        />
        <DetailSummaryItem
          label="Vehicle profile"
          value={`${vehicle.year ? `${vehicle.year} · ` : ""}${vehicle.transmission ?? "Transmission not set"}`}
          hint={`${vehicle.fuelType ?? "Fuel type not set"} · Engine ${vehicle.engineSize ?? "Not set"}`}
        />
        <DetailSummaryItem
          label="Variant / color"
          value={vehicle.variant ?? "No variant on file"}
          hint={vehicle.color ?? "No color on file"}
        />
        <DetailSummaryItem
          label="Mileage"
          value={vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString()} km` : "Mileage not set"}
          hint={`Created ${formatDate(vehicle.createdAt)}`}
        />
        <DetailSummaryItem
          label="Status"
          value={vehicle.status}
          hint={`Last updated ${formatDateTime(vehicle.updatedAt)}`}
        />
      </DetailSummaryGrid>

      <VehicleServiceHistory
        entries={serviceHistory}
        canViewServiceHistory={canViewServiceHistory}
      />
    </div>
  );
}
