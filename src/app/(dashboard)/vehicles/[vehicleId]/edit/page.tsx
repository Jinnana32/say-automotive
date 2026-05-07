import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { mapVehicleDetailToFormValues } from "@/features/vehicles/mappers";
import { getVehicleFormLookupData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import { getVehicleById } from "@/features/vehicles/queries/vehicle-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditVehiclePageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
};

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  await requireStaffCapability("vehicles:write");

  const { vehicleId } = await params;
  const [vehicle, customerOptions, lookupData] = await Promise.all([
    getVehicleById(vehicleId),
    listCustomerOptions(),
    getVehicleFormLookupData(),
  ]);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${vehicle.make} ${vehicle.model}`}
        description="Vehicle records should remain reliable because they flow into quotations, job orders, invoices, and service history."
      />
      <VehicleForm
        mode="edit"
        customerOptions={customerOptions}
        initialValues={mapVehicleDetailToFormValues(vehicle)}
        lookupData={lookupData}
      />
    </div>
  );
}
