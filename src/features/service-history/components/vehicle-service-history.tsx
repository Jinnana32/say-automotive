import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import type { ServiceHistoryEntry } from "@/features/service-history/types";
import { ServiceHistoryCard } from "@/features/service-history/components/service-history-card";
import { splitServiceHistoryEntries } from "@/features/service-history/utils";

export function VehicleServiceHistory({
  entries,
  canViewServiceHistory,
}: {
  entries: ServiceHistoryEntry[];
  canViewServiceHistory: boolean;
}) {
  if (!canViewServiceHistory) {
    return (
      <SectionCard
        title="Service history"
        description="Completed and active workshop records for this vehicle."
      >
        <EmptyState
          title="Service history is unavailable"
          description="This staff role does not have access to job order history for this vehicle."
        />
      </SectionCard>
    );
  }

  const { active, history } = splitServiceHistoryEntries(entries);

  return (
    <SectionCard
      title="Service history"
      description="Completed service records appear newest first. Active jobs stay separate so the current work is easy to spot."
    >
      <div className="space-y-6">
        {active.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Active job</h3>
              <p className="text-sm text-muted-foreground">
                Current workshop activity that has not reached final service history yet.
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
            <h3 className="text-sm font-semibold text-foreground">Completed service history</h3>
            <p className="text-sm text-muted-foreground">
              Released, paid, ready-for-billing, and completed job orders become this vehicle&apos;s service record.
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
    </SectionCard>
  );
}
