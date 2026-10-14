import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { IconActionLink } from "@/components/shared/icon-action";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentHistoryTable } from "@/features/customers/components/document-history-table";
import { RecordHistoryTabs } from "@/features/service-history/components/record-history-tabs";
import { ServiceHistoryLedger } from "@/features/service-history/components/service-history-ledger";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import { formatDate } from "@/lib/dates";
import { getCustomerById } from "@/features/customers/queries/customer-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requireAuthenticatedStaff();
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  const canViewServiceHistory = session.capabilities.includes("job_orders:read");
  const serviceHistory = canViewServiceHistory
    ? await listServiceHistoryByVehicleIds(customer.vehicles.map((vehicle) => vehicle.id))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.displayName}
        description="Customer profile, contact details, and linked vehicles."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>Edit customer</Link>
            </Button>
            <Button asChild>
              <Link href={`/vehicles/new?customerId=${customer.id}`}>Add vehicle</Link>
            </Button>
          </>
        }
      />

      <RecordHistoryTabs
        defaultTab="overview"
        overview={
          <DetailSummaryGrid>
            <DetailSummaryItem
              label="Customer type"
              value={toTitleCase(customer.customerType.replace("_", " "))}
              hint="Record classification for operational flows."
            />
            <DetailSummaryItem
              label="Primary contact"
              value={customer.contactNumber ?? "No contact number"}
              hint={customer.email ?? "No email on file"}
            />
            <DetailSummaryItem
              label="Secondary contact"
              value={customer.contactNumberSecondary ?? "No secondary contact number"}
              hint="Optional backup number for this customer."
            />
            <DetailSummaryItem
              label="Fleet / company"
              value={customer.companyName ?? "No company or fleet"}
              hint={`${customer.vehicles.length} linked vehicle${customer.vehicles.length === 1 ? "" : "s"}`}
            />
            <DetailSummaryItem
              label="Customer status"
              value={toTitleCase(customer.status)}
              hint={`Created ${formatDate(customer.createdAt)}`}
            />
            <DetailSummaryItem
              label="Address"
              value={customer.address ?? "No address on file"}
              hint="Used for service records and invoicing."
            />
            <DetailSummaryItem
              label="Notes"
              value={customer.notes ?? "No notes"}
              hint="Internal service reminders and preferences."
            />
          </DetailSummaryGrid>
        }
        vehiclesDescription="Vehicles currently linked to this customer."
        vehicles={
          customer.vehicles.length === 0 ? (
            <EmptyState
              title="No vehicles linked yet"
              description="Add a vehicle before creating quotations or job orders."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Plate / VIN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            className="font-semibold text-foreground underline-offset-4 hover:underline"
                          >
                            {vehicle.make} {vehicle.model}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year ? String(vehicle.year) : "Year not set"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.plateNumber ?? "No plate"} / {vehicle.vin ?? "No VIN"}
                      </TableCell>
                      <TableCell className="capitalize">{vehicle.status}</TableCell>
                      <TableCell className="w-14 text-right">
                        <IconActionLink
                          href={`/vehicles/${vehicle.id}`}
                          label={`Open vehicle ${vehicle.make} ${vehicle.model}`}
                          icon={Eye}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        }
        serviceHistoryDescription="In-progress work stays at the top. Completed visits across this customer's vehicles are newest first."
        documentsDescription="Quotations, job orders, invoices, and payments for this customer."
        serviceHistory={
          canViewServiceHistory ? (
            customer.vehicles.length === 0 ? (
              <EmptyState
                title="No service history found for this customer's vehicles"
                description="Vehicles need to be linked first before service records can appear here."
              />
            ) : (
              <ServiceHistoryLedger
                entries={serviceHistory}
                showVehicleLabel={customer.vehicles.length > 1}
              />
            )
          ) : (
            <EmptyState
              title="Service history is unavailable"
              description="This staff role does not have access to job order history for this customer."
            />
          )
        }
        documents={
          <DocumentHistoryTable
            entries={customer.documentHistory}
            emptyDescription="Quotations, job orders, invoices, and payments for this customer will appear here."
          />
        }
      />
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
