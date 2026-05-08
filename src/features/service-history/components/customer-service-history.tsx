import type { CustomerVehicleSummary } from "@/features/customers/types";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { ServiceHistoryCard } from "@/features/service-history/components/service-history-card";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { groupServiceHistoryByVehicle, splitServiceHistoryEntries } from "@/features/service-history/utils";

export function CustomerServiceHistory({
  vehicles,
  entries,
  canViewServiceHistory,
}: {
  vehicles: CustomerVehicleSummary[];
  entries: ServiceHistoryEntry[];
  canViewServiceHistory: boolean;
}) {
  if (!canViewServiceHistory) {
    return (
      <SectionCard
        title="Service history"
        description="Completed and active workshop records across this customer&apos;s vehicles."
      >
        <EmptyState
          title="Service history is unavailable"
          description="This staff role does not have access to job order history for this customer."
        />
      </SectionCard>
    );
  }

  const groupedEntries = groupServiceHistoryByVehicle(entries);

  return (
    <SectionCard
      title="Service history"
      description="Grouped by vehicle so recent repairs, active jobs, and billing outcomes are easy to scan."
    >
      {vehicles.length === 0 ? (
        <EmptyState
          title="No service history found for this customer's vehicles"
          description="Vehicles need to be linked first before service records can appear here."
        />
      ) : (
        <div className="space-y-5">
          {vehicles.map((vehicle) => {
            const vehicleEntries = groupedEntries.get(vehicle.id) ?? [];
            const { active, history } = splitServiceHistoryEntries(vehicleEntries);

            return (
              <div key={vehicle.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-col gap-2 border-b border-border/70 pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.year ? `${vehicle.year} · ` : ""}
                      {vehicle.plateNumber ?? "No plate number"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {active.length > 0 ? <Badge variant="warning">{active.length} active</Badge> : null}
                    {history.length > 0 ? <Badge variant="secondary">{history.length} history item{history.length === 1 ? "" : "s"}</Badge> : null}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {active.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-foreground">Active job</h4>
                        <p className="text-sm text-muted-foreground">
                          Current work in progress for this vehicle.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {active.map((entry) => (
                          <ServiceHistoryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">Completed history</h4>
                      <p className="text-sm text-muted-foreground">
                        Newest completed or released service records first.
                      </p>
                    </div>
                    {history.length === 0 ? (
                      <EmptyState
                        title="No service history yet"
                        description="Completed or released job orders for this vehicle will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {history.map((entry) => (
                          <ServiceHistoryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
