import type { JobOrderItemDetail, JobOrderPrintDetail } from "@/features/job-orders/types";

export type JobOrderPrintWorkLine = {
  id: string;
  itemType: JobOrderItemDetail["itemType"];
  description: string;
  quantityLabel: string;
  unitPrice: number;
  total: number;
  approvalStatus: JobOrderItemDetail["approvalStatus"];
  usageStatus: JobOrderItemDetail["usageStatus"];
  isAdditional: boolean;
};

export type JobOrderPrintPartsUsageLine = {
  id: string;
  description: string;
  plannedQuantity: string;
  usedQuantity: string;
  returnedQuantity: string;
  remainingQuantity: string;
  stockAvailability: string;
  usageStatus: JobOrderItemDetail["usageStatus"];
};

export type JobOrderPrintBreakdown = {
  workLines: JobOrderPrintWorkLine[];
  partUsageLines: JobOrderPrintPartsUsageLine[];
  totalParts: number;
  totalLabor: number;
  pendingExtras: number;
  rejectedExtras: number;
  billableTotal: number;
};

export function buildJobOrderPrintBreakdown(
  jobOrder: Pick<JobOrderPrintDetail, "items" | "billableTotal" | "rejectedAdditionalTotal">,
): JobOrderPrintBreakdown {
  const workLines = jobOrder.items.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    description: item.description,
    quantityLabel: trimNumeric(item.quantity),
    unitPrice: item.unitPrice,
    total: item.total,
    approvalStatus: item.approvalStatus,
    usageStatus: item.usageStatus,
    isAdditional: item.isAdditional,
  }));

  const acceptedItems = jobOrder.items.filter((item) => item.approvalStatus !== "rejected");
  const totalParts = roundCurrency(
    acceptedItems
      .filter((item) => item.itemType === "product")
      .reduce((sum, item) => sum + item.total, 0),
  );
  const totalLabor = roundCurrency(
    acceptedItems
      .filter((item) => item.itemType === "service" || item.itemType === "labor")
      .reduce((sum, item) => sum + item.total, 0),
  );
  const pendingExtras = roundCurrency(
    jobOrder.items
      .filter((item) => item.isAdditional && item.approvalStatus === "pending")
      .reduce((sum, item) => sum + item.total, 0),
  );

  const partUsageLines = jobOrder.items
    .filter((item) => item.itemType === "product")
    .map((item) => ({
      id: item.id,
      description: item.description,
      plannedQuantity: trimNumeric(item.quantity),
      usedQuantity: trimNumeric(item.inventoryTracking?.netUsedQuantity ?? 0),
      returnedQuantity: trimNumeric(item.inventoryTracking?.returnedQuantity ?? 0),
      remainingQuantity: trimNumeric(item.inventoryTracking?.remainingUsageQuantity ?? item.quantity),
      stockAvailability: formatStockAvailability(item),
      usageStatus: item.usageStatus,
    }));

  return {
    workLines,
    partUsageLines,
    totalParts,
    totalLabor,
    pendingExtras,
    rejectedExtras: jobOrder.rejectedAdditionalTotal,
    billableTotal: jobOrder.billableTotal,
  };
}

function formatStockAvailability(item: JobOrderItemDetail) {
  if (!item.inventoryTracking) {
    return "No stock tracking";
  }

  if (!item.inventoryTracking.hasStockRecord) {
    return "No stock record";
  }

  if (item.inventoryTracking.availableQuantity === null) {
    return "Available qty unknown";
  }

  return trimNumeric(item.inventoryTracking.availableQuantity);
}

function trimNumeric(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
