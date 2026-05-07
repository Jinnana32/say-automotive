import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { SectionCard } from "@/components/shared/section-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { getCustomerById } from "@/features/customers/queries/customer-queries";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

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

      <SectionCard
        title="Vehicles"
        description="Vehicles currently linked to this customer."
        contentClassName="p-0"
      >
        {customer.vehicles.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">
            No vehicles linked yet. Add a vehicle before creating quotations or job orders.
          </div>
        ) : (
          <div className="overflow-hidden rounded-b-[1.25rem]">
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
                        <p className="font-semibold">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year ? String(vehicle.year) : "Year not set"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.plateNumber ?? "No plate"} / {vehicle.vin ?? "No VIN"}
                    </TableCell>
                    <TableCell className="capitalize">{vehicle.status}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/vehicles/${vehicle.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
