import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DocumentHistoryTable } from "@/features/customers/components/document-history-table";
import { getCustomerById } from "@/features/customers/queries/customer-queries";
import { RecordHistoryTabs } from "@/features/service-history/components/record-history-tabs";
import { ServiceHistoryLedger } from "@/features/service-history/components/service-history-ledger";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import { getVehicleById } from "@/features/vehicles/queries/vehicle-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
  searchParams: Promise<{
    historicalSaved?: string;
  }>;
};

export default async function VehicleDetailPage({ params, searchParams }: VehicleDetailPageProps) {
  const session = await requireAuthenticatedStaff();
  const { vehicleId } = await params;
  const { historicalSaved } = await searchParams;
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  const canManageVehicles = session.capabilities.includes("vehicles:write");
  const canRecordPastService = session.capabilities.includes("job_orders:write");
  const canViewServiceHistory = session.capabilities.includes("job_orders:read");
  const canViewCustomers = session.capabilities.includes("customers:read");
  const [serviceHistory, customer] = await Promise.all([
    canViewServiceHistory ? listServiceHistoryByVehicleIds([vehicle.id]) : Promise.resolve([]),
    canViewCustomers ? getCustomerById(vehicle.customerId) : Promise.resolve(null),
  ]);
  const documents = (customer?.documentHistory ?? []).filter((entry) => entry.vehicleId === vehicle.id);

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
            {canRecordPastService ? (
              <Button asChild variant="outline">
                <Link href={`/vehicles/${vehicle.id}/past-service/new`}>Record past service</Link>
              </Button>
            ) : null}
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

      {historicalSaved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Past service record saved to this vehicle&apos;s service history.
        </div>
      ) : null}

      <RecordHistoryTabs
        defaultTab="overview"
        overview={
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
        }
        serviceHistoryDescription="In-progress work stays at the top. Completed visits for this vehicle are newest first."
        documentsDescription="Quotations, job orders, invoices, and payments for this vehicle."
        serviceHistory={
          canViewServiceHistory ? (
            <ServiceHistoryLedger entries={serviceHistory} />
          ) : (
            <EmptyState
              title="Service history is unavailable"
              description="This staff role does not have access to job order history for this vehicle."
            />
          )
        }
        documents={
          <DocumentHistoryTable
            entries={documents}
            showVehicleColumn={false}
            emptyDescription="Quotations, job orders, invoices, and payments for this vehicle will appear here."
          />
        }
      />
    </div>
  );
}
