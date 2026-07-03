import { PageHeader } from "@/components/shared/page-header";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { getVehicleFormLookupData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type NewVehiclePageProps = {
  searchParams: Promise<{
    customerId?: string;
    plateNumber?: string;
  }>;
};

export default async function NewVehiclePage({ searchParams }: NewVehiclePageProps) {
  await requireStaffCapability("vehicles:write");

  const { customerId = "", plateNumber = "" } = await searchParams;
  const [customerOptions, lookupData] = await Promise.all([
    listCustomerOptions(),
    getVehicleFormLookupData(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Vehicle"
        description="Register a vehicle under a customer before building workshop documents on top of it."
      />
      <VehicleForm
        mode="create"
        customerOptions={customerOptions}
        initialValues={{
          customerId,
          make: "",
          model: "",
          year: "",
          transmission: "",
          mileage: "",
          plateNumber: plateNumber.trim(),
          vin: "",
          engineSize: "",
          variant: "",
          fuelType: "",
          color: "",
          status: "active",
        }}
        lookupData={lookupData}
      />
    </div>
  );
}
