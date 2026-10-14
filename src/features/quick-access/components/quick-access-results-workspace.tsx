"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailSummaryGrid, DetailSummaryItem } from "@/components/shared/detail-summary-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { IconActionGroup, IconActionLink } from "@/components/shared/icon-action";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { InvoiceStatus } from "@/features/invoices/types";
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { ServiceHistoryLedger } from "@/features/service-history/components/service-history-ledger";
import type { QuickAccessCustomerRecord } from "@/features/quick-access/types";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function QuickAccessResultsWorkspace({
  records,
  plateQuery,
  customerLastNameQuery,
  canCreateQuotations,
  canViewQuotations,
  canViewServiceHistory,
  canRecordPastService,
}: {
  records: QuickAccessCustomerRecord[];
  plateQuery: string;
  customerLastNameQuery: string;
  canCreateQuotations: boolean;
  canViewQuotations: boolean;
  canViewServiceHistory: boolean;
  canRecordPastService: boolean;
}) {
  const [activeRecordId, setActiveRecordId] = useState(records[0]?.id ?? "");
  const activeRecord =
    records.find((record) => record.id === activeRecordId) ?? records[0] ?? null;
  const searchSummary = plateQuery
    ? `Plate lookup for ${plateQuery}`
    : `Customer lookup for ${customerLastNameQuery}`;

  if (!activeRecord) {
    return null;
  }

  return (
    <div className="space-y-6">
      {records.length > 1 ? (
        <SectionCard
          title="Matched records"
          description={`${records.length} records are available for ${searchSummary.toLowerCase()}. Pick the one you want to inspect first.`}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {records.map((record) => {
              const isActive = record.id === activeRecord.id;
              const highlightedVehicle = record.vehicles.find(
                (vehicle) => vehicle.id === record.highlightedVehicleId,
              );

              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setActiveRecordId(record.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/70 bg-background hover:bg-muted/35",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{record.customer.displayName}</p>
                    <Badge variant="secondary">{record.match.label}</Badge>
                    {record.match.plateMatchKind === "possible" ? (
                      <Badge variant="outline">Review closely</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {highlightedVehicle
                      ? `${highlightedVehicle.make} ${highlightedVehicle.model} · ${highlightedVehicle.plateNumber ?? "No plate"}`
                      : `${record.vehicles.length} vehicle${record.vehicles.length === 1 ? "" : "s"} on file`}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <QuickAccessRecordPanel
        key={activeRecord.id}
        record={activeRecord}
        searchSummary={searchSummary}
        canCreateQuotations={canCreateQuotations}
        canViewQuotations={canViewQuotations}
        canViewServiceHistory={canViewServiceHistory}
        canRecordPastService={canRecordPastService}
      />
    </div>
  );
}

function QuickAccessRecordPanel({
  record,
  searchSummary,
  canCreateQuotations,
  canViewQuotations,
  canViewServiceHistory,
  canRecordPastService,
}: {
  record: QuickAccessCustomerRecord;
  searchSummary: string;
  canCreateQuotations: boolean;
  canViewQuotations: boolean;
  canViewServiceHistory: boolean;
  canRecordPastService: boolean;
}) {
  const highlightedVehicle =
    record.vehicles.find((vehicle) => vehicle.id === record.highlightedVehicleId) ??
    (record.vehicles.length === 1 ? record.vehicles[0] : null);
  const isVehicleLookup = record.match.source === "plate" && highlightedVehicle !== null;
  const visibleServiceHistory = isVehicleLookup
    ? record.serviceHistory.filter((entry) => entry.vehicleId === highlightedVehicle?.id)
    : record.serviceHistory;

  const showVehiclesTab = !isVehicleLookup && record.vehicles.length > 1;
  const showDocumentsTab = canViewQuotations || canViewServiceHistory;
  const defaultTab = canViewServiceHistory
    ? "service-history"
    : showDocumentsTab
      ? "documents"
      : "vehicles";

  return (
    <div className="space-y-6">
      <SectionCard
        title={
          isVehicleLookup && highlightedVehicle
            ? `${highlightedVehicle.make} ${highlightedVehicle.model}`
            : record.customer.displayName
        }
        description={searchSummary}
        action={
          <div className="flex flex-wrap gap-2">
            {canCreateQuotations ? (
              <Button asChild size="sm">
                <Link
                  href={getQuickAccessQuotationHref(
                    record.customer.id,
                    highlightedVehicle?.id,
                  )}
                >
                  New quotation
                </Link>
              </Button>
            ) : null}
            {highlightedVehicle ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/vehicles/${highlightedVehicle.id}`}>Open vehicle</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href={`/customers/${record.customer.id}`}>Open customer</Link>
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={
                (isVehicleLookup && highlightedVehicle
                  ? highlightedVehicle.status
                  : record.customer.status) === "active"
                  ? "success"
                  : "neutral"
              }
            >
              {isVehicleLookup && highlightedVehicle ? highlightedVehicle.status : record.customer.status}
            </StatusBadge>
            <Badge variant="secondary">{record.match.label}</Badge>
            {highlightedVehicle?.plateNumber ? (
              <Badge variant="outline">Plate {highlightedVehicle.plateNumber}</Badge>
            ) : null}
            {!isVehicleLookup && record.customer.customerCode ? (
              <Badge variant="outline">{record.customer.customerCode}</Badge>
            ) : null}
          </div>

          {highlightedVehicle ? (
            <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-4">
              <DetailSummaryItem
                label="Customer"
                value={record.customer.displayName}
                hint={`${formatQuickAccessContact(record.customer)} · ${record.customer.email ?? "No email on file"}`}
              />
              <DetailSummaryItem
                label="Plate / VIN"
                value={highlightedVehicle.plateNumber ?? "No plate number"}
                hint={highlightedVehicle.vin ?? "No VIN on file"}
              />
              <DetailSummaryItem
                label="Mileage"
                value={formatMileage(highlightedVehicle.mileage)}
                hint={`${highlightedVehicle.color ?? "No color"} · ${highlightedVehicle.variant ?? "No variant"}`}
              />
              <DetailSummaryItem
                label="Specs"
                value={`${highlightedVehicle.year ? `${highlightedVehicle.year} · ` : ""}${highlightedVehicle.transmission ?? "Transmission not set"}`}
                hint={`${highlightedVehicle.fuelType ?? "Fuel type not set"} · Engine ${highlightedVehicle.engineSize ?? "Not set"}`}
              />
            </DetailSummaryGrid>
          ) : (
            <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-4">
              <DetailSummaryItem
                label="Customer type"
                value={toTitleCase(record.customer.customerType.replaceAll("_", " "))}
                hint={record.customer.companyName ?? record.customer.displayName}
              />
              <DetailSummaryItem
                label="Primary contact"
                value={record.customer.contactNumber ?? "No contact number"}
                hint={record.customer.email ?? "No email on file"}
              />
              <DetailSummaryItem
                label="Address"
                value={record.customer.address ?? "No address on file"}
                hint={record.customer.notes ?? "No customer notes on file"}
              />
              <DetailSummaryItem
                label="Vehicles on file"
                value={`${record.vehicles.length} vehicle${record.vehicles.length === 1 ? "" : "s"}`}
                hint={
                  showVehiclesTab
                    ? "Open the Vehicles tab to pick one."
                    : "No vehicles linked to this customer yet."
                }
              />
            </DetailSummaryGrid>
          )}
        </div>
      </SectionCard>

      {canViewServiceHistory || showDocumentsTab || showVehiclesTab ? (
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {canViewServiceHistory ? (
              <TabsTrigger value="service-history">Service history</TabsTrigger>
            ) : null}
            {showDocumentsTab ? <TabsTrigger value="documents">Documents</TabsTrigger> : null}
            {showVehiclesTab ? <TabsTrigger value="vehicles">Vehicles</TabsTrigger> : null}
          </TabsList>

          {canViewServiceHistory ? (
            <TabsContent value="service-history" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isVehicleLookup
                  ? "In-progress work stays at the top. Completed visits for this vehicle are newest first."
                  : "In-progress work stays at the top. Completed visits across this customer's vehicles are newest first."}
              </p>
              <ServiceHistoryLedger
                entries={visibleServiceHistory}
                showVehicleLabel={!isVehicleLookup && record.vehicles.length > 1}
              />
            </TabsContent>
          ) : null}

          {showDocumentsTab ? (
            <TabsContent value="documents">
              <QuickAccessDocuments
                record={record}
                serviceHistory={visibleServiceHistory}
                canViewQuotations={canViewQuotations}
                canViewServiceHistory={canViewServiceHistory}
              />
            </TabsContent>
          ) : null}

          {showVehiclesTab ? (
            <TabsContent value="vehicles">
              <SectionCard
                title="Vehicles on file"
                description="Pick a vehicle without leaving quick access."
              >
                <QuickAccessVehiclesTable
                  vehicles={record.vehicles}
                  highlightedVehicleId={record.highlightedVehicleId}
                  canRecordPastService={canRecordPastService}
                />
              </SectionCard>
            </TabsContent>
          ) : null}
        </Tabs>
      ) : null}
    </div>
  );
}

function QuickAccessDocuments({
  record,
  serviceHistory,
  canViewQuotations,
  canViewServiceHistory,
}: {
  record: QuickAccessCustomerRecord;
  serviceHistory: ServiceHistoryEntry[];
  canViewQuotations: boolean;
  canViewServiceHistory: boolean;
}) {
  const invoices = useMemo(() => {
    const uniqueInvoices = new Map<
      string,
      {
        id: string;
        invoiceNumber: string;
        status: InvoiceStatus;
        totalAmount: number;
        vehicleLabel: string;
        serviceDate: string;
        jobOrderId: string;
        jobOrderNumber: string;
      }
    >();

    for (const entry of serviceHistory) {
      if (!entry.invoice || uniqueInvoices.has(entry.invoice.id)) {
        continue;
      }

      uniqueInvoices.set(entry.invoice.id, {
        id: entry.invoice.id,
        invoiceNumber: entry.invoice.invoiceNumber,
        status: entry.invoice.status,
        totalAmount: entry.invoice.totalAmount,
        vehicleLabel: entry.vehicleLabel,
        serviceDate: entry.serviceDate,
        jobOrderId: entry.jobOrderId,
        jobOrderNumber: entry.jobOrderNumber,
      });
    }

    return [...uniqueInvoices.values()];
  }, [serviceHistory]);

  const hasQuotations = canViewQuotations && record.recentQuotations.length > 0;
  const hasInvoices = canViewServiceHistory && invoices.length > 0;

  if (!hasQuotations && !hasInvoices) {
    return (
      <EmptyState
        title="No documents yet"
        description="Quotations and invoices for this record will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {canViewQuotations ? (
        <SectionCard
          title="Quotations"
          description="Recent estimates for this customer."
        >
          {record.recentQuotations.length === 0 ? (
            <EmptyState
              title="No recent quotations"
              description="This customer does not have quotation history on file yet."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.recentQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{quotation.quotationNumber}</p>
                          <p className="text-xs text-muted-foreground">{quotation.customerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-foreground">{quotation.vehicleLabel}</p>
                          {quotation.vehicleId === record.highlightedVehicleId ? (
                            <Badge variant="secondary">Matched vehicle</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <QuotationStatusBadge status={quotation.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(quotation.totalAmount)}</TableCell>
                      <TableCell>{formatDateTime(quotation.createdAt)}</TableCell>
                      <TableCell className="w-14 text-right">
                        <IconActionLink
                          href={`/quotations/${quotation.id}`}
                          label={`Open quotation ${quotation.quotationNumber}`}
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
      ) : null}

      {canViewServiceHistory ? (
        <SectionCard
          title="Invoices"
          description="Billing documents linked to these service visits."
        >
          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Invoices appear here once a service visit is billed."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Job order</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(invoice.serviceDate)}</TableCell>
                      <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.vehicleLabel}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/job-orders/${invoice.jobOrderId}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {invoice.jobOrderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="w-14 text-right">
                        <IconActionLink
                          href={`/invoices/${invoice.id}`}
                          label={`Open invoice ${invoice.invoiceNumber}`}
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
      ) : null}
    </div>
  );
}

function QuickAccessVehiclesTable({
  vehicles,
  highlightedVehicleId,
  canRecordPastService,
}: {
  vehicles: QuickAccessCustomerRecord["vehicles"];
  highlightedVehicleId: string | null;
  canRecordPastService: boolean;
}) {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize));
  const paginatedVehicles = useMemo(
    () => vehicles.slice((page - 1) * pageSize, page * pageSize),
    [page, vehicles],
  );

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="No linked vehicles"
        description="This customer does not have a vehicle record linked yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Specs</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVehicles.map((vehicle) => {
              const isHighlighted = vehicle.id === highlightedVehicleId;

              return (
                <TableRow
                  key={vehicle.id}
                  className={cn(isHighlighted ? "bg-primary/5 hover:bg-primary/10" : "")}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.variant ?? "No variant"} · {vehicle.color ?? "No color"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{vehicle.plateNumber ?? "No plate"}</p>
                      {isHighlighted ? <Badge variant="secondary">Matched vehicle</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vehicle.year ? `${vehicle.year} · ` : ""}
                    {vehicle.transmission ?? "Transmission not set"}
                    <div className="text-xs text-muted-foreground">
                      {vehicle.fuelType ?? "Fuel type not set"} · Engine {vehicle.engineSize ?? "Not set"}
                    </div>
                  </TableCell>
                  <TableCell>{formatMileage(vehicle.mileage)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={vehicle.status === "active" ? "success" : "neutral"}>
                      {vehicle.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatDateTime(vehicle.updatedAt)}</TableCell>
                  <TableCell className="w-24 text-right">
                    <IconActionGroup>
                      <IconActionLink
                        href={`/vehicles/${vehicle.id}`}
                        label={`Open vehicle ${vehicle.make} ${vehicle.model}`}
                        icon={Eye}
                      />
                      {canRecordPastService ? (
                        <IconActionLink
                          href={`/vehicles/${vehicle.id}/past-service/new`}
                          label={`Record past service for ${vehicle.make} ${vehicle.model}`}
                          icon={History}
                        />
                      ) : null}
                    </IconActionGroup>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getQuickAccessQuotationHref(customerId: string, vehicleId?: string) {
  const searchParams = new URLSearchParams({ customerId });

  if (vehicleId) {
    searchParams.set("vehicleId", vehicleId);
  }

  return `/quotations/new?${searchParams.toString()}`;
}

function formatMileage(value: number | null) {
  return value !== null ? `${value.toLocaleString()} km` : "Mileage not set";
}

function formatQuickAccessContact(customer: {
  contactNumber: string | null;
  contactNumberSecondary: string | null;
}) {
  if (!customer.contactNumber && !customer.contactNumberSecondary) {
    return "No contact number";
  }

  if (customer.contactNumber && customer.contactNumberSecondary) {
    return `${customer.contactNumber} · ${customer.contactNumberSecondary}`;
  }

  return customer.contactNumber ?? customer.contactNumberSecondary ?? "No contact number";
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
