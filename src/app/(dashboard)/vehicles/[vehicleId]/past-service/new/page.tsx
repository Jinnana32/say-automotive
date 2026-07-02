import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { HistoricalServiceForm } from "@/features/historical-service/components/historical-service-form";
import { getVehicleById } from "@/features/vehicles/queries/vehicle-queries";
import { requireStaffCapability } from "@/lib/auth/session";
import { getBusinessNow } from "@/lib/dates";

export const dynamic = "force-dynamic";

type RecordPastServicePageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function RecordPastServicePage({
  params,
  searchParams,
}: RecordPastServicePageProps) {
  await requireStaffCapability("job_orders:write");

  const { vehicleId } = await params;
  const { saved } = await searchParams;
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  const vehicleLabel = `${vehicle.make} ${vehicle.model}${
    vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""
  }`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Service Desk" },
          { label: "Vehicles", href: "/vehicles" },
          { label: vehicleLabel, href: `/vehicles/${vehicle.id}` },
          { label: "Record past service" },
        ]}
      />

      <PageHeader
        title="Record past service"
        description={`Backfill service history for ${vehicleLabel} without creating quotations, invoices, or inventory movements.`}
      />

      <HistoricalServiceForm
        vehicleId={vehicle.id}
        vehicleLabel={vehicleLabel}
        maxServiceDate={getBusinessNow().toISODate() ?? ""}
        showSavedMessage={saved === "1"}
      />
    </div>
  );
}
