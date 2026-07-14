import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";

import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { IconActionLink } from "@/components/shared/icon-action";
import { SectionCard } from "@/components/shared/section-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentMethodBadge, InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { JobOrderStatusBadge } from "@/features/job-orders/components/job-order-status-badge";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { CustomerServiceHistory } from "@/features/service-history/components/customer-service-history";
import { listServiceHistoryByVehicleIds } from "@/features/service-history/queries/service-history-queries";
import type { CustomerDocumentHistoryItem } from "@/features/customers/types";
import { formatCurrency } from "@/lib/currency";
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
        )}
      </SectionCard>

      <CustomerServiceHistory
        vehicles={customer.vehicles}
        entries={serviceHistory}
        canViewServiceHistory={canViewServiceHistory}
      />

      <SectionCard
        title="Document history"
        description="Related quotations, job orders, invoices, and payments for this customer."
        contentClassName="p-0"
      >
        {customer.documentHistory.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">
            No related documents recorded yet. Items will appear here as this customer moves through the
            quotation, service, billing, and payment workflow.
          </div>
        ) : (
          <div className="overflow-hidden rounded-b-[1.25rem]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status / method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Linked records</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.documentHistory.map((entry) => (
                  <TableRow key={`${entry.documentType}-${entry.id}`}>
                    <TableCell>{formatDate(entry.occurredAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                          {formatDocumentType(entry.documentType)}
                        </p>
                        <Link href={entry.documentHref} className="font-semibold underline-offset-4 hover:underline">
                          {entry.documentLabel}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{entry.vehicleLabel ?? "No vehicle"}</TableCell>
                    <TableCell>{renderDocumentStatus(entry)}</TableCell>
                    <TableCell>{entry.amount === null ? "—" : formatCurrency(entry.amount)}</TableCell>
                    <TableCell>
                      {entry.linkedRecords.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No linked records</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {entry.linkedRecords.map((record) => (
                            <Link
                              key={`${entry.id}-${record.href}`}
                              href={record.href}
                              className="text-sm underline-offset-4 hover:underline"
                            >
                              {record.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <IconActionLink
                        href={entry.documentHref}
                        label={`Open document ${entry.documentLabel}`}
                        icon={Eye}
                      />
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

function formatDocumentType(value: CustomerDocumentHistoryItem["documentType"]) {
  return value.replaceAll("_", " ");
}

function renderDocumentStatus(entry: CustomerDocumentHistoryItem) {
  if (entry.documentType === "quotation") {
    return <QuotationStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "job_order") {
    return <JobOrderStatusBadge status={entry.status} />;
  }

  if (entry.documentType === "invoice") {
    return <InvoiceStatusBadge status={entry.status} />;
  }

  return <PaymentMethodBadge method={entry.paymentMethod} />;
}
