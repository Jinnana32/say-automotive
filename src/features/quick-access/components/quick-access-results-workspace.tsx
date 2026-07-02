"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { QuotationStatusBadge } from "@/features/quotations/components/quotation-status-badge";
import { MobileServiceHistoryAccordion } from "@/features/service-history/components/mobile-service-history-accordion";
import type { QuickAccessCustomerRecord } from "@/features/quick-access/types";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
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
    record.vehicles.find((vehicle) => vehicle.id === record.highlightedVehicleId) ?? null;
  const isVehicleLookup = record.match.source === "plate" && highlightedVehicle !== null;
  const visibleServiceHistory = isVehicleLookup
    ? record.serviceHistory.filter((entry) => entry.vehicleId === highlightedVehicle?.id)
    : record.serviceHistory;

  return (
    <div className="space-y-6">
      {isVehicleLookup && highlightedVehicle ? (
        <SectionCard
          title={`${highlightedVehicle.make} ${highlightedVehicle.model}`}
          description={searchSummary}
          action={
            <div className="flex flex-wrap gap-2">
              {canCreateQuotations ? (
                <Button asChild size="sm">
                  <Link
                    href={getQuickAccessQuotationHref(
                      record.customer.id,
                      record.highlightedVehicleId ?? undefined,
                    )}
                  >
                    New quotation
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link href={`/vehicles/${highlightedVehicle.id}`}>Open vehicle</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/customers/${record.customer.id}`}>Open customer</Link>
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={highlightedVehicle.status === "active" ? "success" : "neutral"}>
                {highlightedVehicle.status}
              </StatusBadge>
              <Badge variant="secondary">{record.match.label}</Badge>
              {highlightedVehicle.plateNumber ? (
                <Badge variant="outline">Plate {highlightedVehicle.plateNumber}</Badge>
              ) : null}
            </div>

            <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-3">
              <DetailSummaryItem
                label="Vehicle"
                value={`${highlightedVehicle.make} ${highlightedVehicle.model}`}
                hint={highlightedVehicle.variant ?? "No variant on file"}
              />
              <DetailSummaryItem
                label="Linked customer"
                value={record.customer.displayName}
                hint={`${record.customer.contactNumber ?? "No contact number"} · ${record.customer.email ?? "No email on file"}`}
              />
              <DetailSummaryItem
                label="Plate number"
                value={highlightedVehicle.plateNumber ?? "No plate number"}
                hint={highlightedVehicle.vin ?? "No VIN on file"}
              />
              <DetailSummaryItem
                label="Specs"
                value={`${highlightedVehicle.year ? `${highlightedVehicle.year} · ` : ""}${highlightedVehicle.transmission ?? "Transmission not set"}`}
                hint={`${highlightedVehicle.fuelType ?? "Fuel type not set"} · Engine ${highlightedVehicle.engineSize ?? "Not set"}`}
              />
              <DetailSummaryItem
                label="Mileage"
                value={formatMileage(highlightedVehicle.mileage)}
                hint={`${highlightedVehicle.color ?? "No color"} · ${highlightedVehicle.variant ?? "No variant"}`}
              />
              <DetailSummaryItem
                label="Recent quotations"
                value={
                  canViewQuotations
                    ? `${record.recentQuotations.length} recent quotation${record.recentQuotations.length === 1 ? "" : "s"}`
                    : "Quotation access not enabled"
                }
                hint={
                  canViewQuotations
                    ? "Most recent customer quotations are listed below."
                    : "This staff role cannot review quotation history from quick access."
                }
              />
            </DetailSummaryGrid>
          </div>
        </SectionCard>
      ) : null}

      {isVehicleLookup ? (
        <SectionCard
          title="Customer profile"
          description="This is the linked customer record for the matched vehicle."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={record.customer.status === "active" ? "success" : "neutral"}>
                {record.customer.status}
              </StatusBadge>
              {record.customer.customerCode ? (
                <Badge variant="outline">{record.customer.customerCode}</Badge>
              ) : null}
            </div>

            <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-3">
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
                label="Customer profile"
                value={record.customer.firstName || record.customer.lastName
                  ? `${record.customer.firstName ?? ""} ${record.customer.lastName ?? ""}`.trim()
                  : record.customer.displayName}
                hint={`Created ${formatDateTime(record.customer.createdAt)}`}
              />
              <DetailSummaryItem
                label="Vehicles on file"
                value={`${record.vehicles.length} vehicle${record.vehicles.length === 1 ? "" : "s"}`}
                hint="Review the vehicle table below."
              />
            </DetailSummaryGrid>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title={record.customer.displayName}
          description={searchSummary}
          action={
            <div className="flex flex-wrap gap-2">
              {canCreateQuotations ? (
                <Button asChild size="sm">
                  <Link
                    href={getQuickAccessQuotationHref(
                      record.customer.id,
                      record.highlightedVehicleId ?? undefined,
                    )}
                  >
                    New quotation
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link href={`/customers/${record.customer.id}`}>Open customer</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/vehicles?customerId=${record.customer.id}`}>View all vehicles</Link>
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={record.customer.status === "active" ? "success" : "neutral"}>
                {record.customer.status}
              </StatusBadge>
              <Badge variant="secondary">{record.match.label}</Badge>
              {record.customer.customerCode ? (
                <Badge variant="outline">{record.customer.customerCode}</Badge>
              ) : null}
              {highlightedVehicle?.plateNumber ? (
                <Badge variant="outline">Plate {highlightedVehicle.plateNumber}</Badge>
              ) : null}
            </div>

            <DetailSummaryGrid className="md:grid-cols-2 xl:grid-cols-3">
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
                label="Customer profile"
                value={record.customer.firstName || record.customer.lastName
                  ? `${record.customer.firstName ?? ""} ${record.customer.lastName ?? ""}`.trim()
                  : record.customer.displayName}
                hint={`Created ${formatDateTime(record.customer.createdAt)}`}
              />
              <DetailSummaryItem
                label="Vehicles on file"
                value={`${record.vehicles.length} vehicle${record.vehicles.length === 1 ? "" : "s"}`}
                hint={
                  highlightedVehicle
                    ? `Matched vehicle: ${highlightedVehicle.make} ${highlightedVehicle.model}`
                    : "Review the vehicle table below."
                }
              />
              <DetailSummaryItem
                label="Recent quotations"
                value={
                  canViewQuotations
                    ? `${record.recentQuotations.length} recent quotation${record.recentQuotations.length === 1 ? "" : "s"}`
                    : "Quotation access not enabled"
                }
                hint={
                  canViewQuotations
                    ? "Most recent customer quotations are listed below."
                    : "This staff role cannot review quotation history from quick access."
                }
              />
            </DetailSummaryGrid>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Vehicles on file"
        description="Review all linked vehicles without leaving quick access."
      >
        <QuickAccessVehiclesTable
          vehicles={record.vehicles}
          highlightedVehicleId={record.highlightedVehicleId}
          canRecordPastService={canRecordPastService}
        />
      </SectionCard>

      {canViewServiceHistory ? (
        <SectionCard
          title="Service history"
          description={
            isVehicleLookup
              ? "Collapsed service records for the matched vehicle."
              : "Collapsed service records across this customer's vehicles."
          }
        >
          <MobileServiceHistoryAccordion
            entries={visibleServiceHistory}
            showVehicleLabel={!isVehicleLookup}
          />
        </SectionCard>
      ) : null}

      {canViewQuotations ? (
        <SectionCard
          title="Recent quotations"
          description="Use recent estimate history to understand the customer before continuing intake."
        >
          {record.recentQuotations.length === 0 ? (
            <EmptyState
              title="No recent quotations"
              description="This customer does not have quotation history on file yet."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
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

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
