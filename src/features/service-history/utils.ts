import type { JobOrderItemDetail, JobOrderMechanicAssignment, JobOrderStatus } from "@/features/job-orders/types";
import { calculateJobOrderBillableTotal } from "@/features/job-orders/utils";
import type { ServiceHistoryEntry, ServiceHistoryLineItem, ServiceHistoryPhase } from "@/features/service-history/types";

const ACTIVE_SERVICE_HISTORY_STATUSES: JobOrderStatus[] = [
  "pending",
  "in_progress",
  "waiting_for_parts",
  "waiting_for_customer_approval",
];

const COMPLETED_SERVICE_HISTORY_STATUSES: JobOrderStatus[] = [
  "completed",
  "ready_for_billing",
  "paid",
  "released",
];

export function resolveServiceHistoryPhase(status: JobOrderStatus): ServiceHistoryPhase | null {
  if (ACTIVE_SERVICE_HISTORY_STATUSES.includes(status)) {
    return "active";
  }

  if (COMPLETED_SERVICE_HISTORY_STATUSES.includes(status)) {
    return "history";
  }

  return null;
}

export function resolveServiceHistoryDate(params: {
  releasedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}) {
  return params.releasedAt ?? params.completedAt ?? params.createdAt;
}

export function buildServiceHistorySummary(entry: ServiceHistoryEntry) {
  return (
    normalizeHistoryText(entry.workPerformed) ??
    normalizeHistoryText(entry.customerConcern) ??
    normalizeHistoryText(entry.diagnosis) ??
    entry.services[0]?.label ??
    entry.partsUsed[0]?.label ??
    "No work summary recorded."
  );
}

export function groupServiceHistoryByVehicle(entries: ServiceHistoryEntry[]) {
  return entries.reduce<Map<string, ServiceHistoryEntry[]>>((groups, entry) => {
    const currentEntries = groups.get(entry.vehicleId) ?? [];
    groups.set(entry.vehicleId, [...currentEntries, entry]);
    return groups;
  }, new Map());
}

export function splitServiceHistoryEntries(entries: ServiceHistoryEntry[]) {
  return {
    active: entries.filter((entry) => entry.phase === "active"),
    history: entries.filter((entry) => entry.phase === "history"),
  };
}

export function sortServiceHistoryEntries(entries: ServiceHistoryEntry[]) {
  return [...entries].sort(
    (left, right) => Date.parse(right.serviceDate) - Date.parse(left.serviceDate),
  );
}

export function buildServiceHistoryItems(params: {
  items: JobOrderItemDetail[];
  usageQuantityByItemId: Map<string, number>;
}) {
  const services: ServiceHistoryLineItem[] = [];
  const partsUsed: ServiceHistoryLineItem[] = [];
  const rejectedExtras: ServiceHistoryLineItem[] = [];

  for (const item of params.items) {
    const lineItem: ServiceHistoryLineItem = {
      id: item.id,
      itemType: item.itemType,
      label: item.description,
      quantity: item.quantity,
      amount: item.total,
      isAdditional: item.isAdditional,
      usageSource: "fallback",
    };

    if (item.isAdditional && item.approvalStatus === "rejected") {
      rejectedExtras.push(lineItem);
      continue;
    }

    if (!(item.approvalStatus === "not_required" || item.approvalStatus === "approved")) {
      continue;
    }

    if (item.itemType === "product") {
      const usedQuantity = params.usageQuantityByItemId.get(item.id);

      if (usedQuantity !== undefined) {
        if (usedQuantity > 0) {
          partsUsed.push({
            ...lineItem,
            quantity: usedQuantity,
            usageSource: "actual",
          });
        }

        continue;
      }

      partsUsed.push(lineItem);
      continue;
    }

    services.push(lineItem);
  }

  return {
    services,
    partsUsed,
    rejectedExtras,
    billableTotal: calculateJobOrderBillableTotal(params.items),
  };
}

export function buildUsageQuantityMap(usageRows: Array<{
  jobOrderItemId: string;
  usageType: "use" | "return";
  quantity: number;
}>) {
  const quantities = new Map<string, number>();

  for (const usageRow of usageRows) {
    const currentQuantity = quantities.get(usageRow.jobOrderItemId) ?? 0;
    const nextQuantity =
      usageRow.usageType === "use"
        ? currentQuantity + usageRow.quantity
        : currentQuantity - usageRow.quantity;

    quantities.set(usageRow.jobOrderItemId, Number(nextQuantity.toFixed(4)));
  }

  return quantities;
}

export function mapMechanicNames(mechanics: JobOrderMechanicAssignment[]) {
  return mechanics.map((mechanic) => ({
    id: mechanic.id,
    fullName: mechanic.fullName,
    taskDescription: mechanic.taskDescription,
  }));
}

function normalizeHistoryText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
