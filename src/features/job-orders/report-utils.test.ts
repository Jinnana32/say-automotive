import { describe, expect, it } from "vitest";

import { buildJobOrderPrintBreakdown } from "@/features/job-orders/report-utils";
import type { JobOrderPrintDetail } from "@/features/job-orders/types";

describe("buildJobOrderPrintBreakdown", () => {
  it("keeps work lines, excludes rejected items from accepted totals, and summarizes part usage", () => {
    const jobOrder = {
      items: [
        {
          id: "part-line",
          sourceQuotationItemId: null,
          lineNumber: 1,
          itemType: "product",
          productId: "product-1",
          serviceId: null,
          description: "Engine Oil",
          quantity: 4,
          unitPrice: 500,
          total: 2000,
          isAdditional: false,
          approvalStatus: "not_required",
          usageStatus: "used",
          approvedAt: null,
          rejectedAt: null,
          inventoryTracking: {
            hasStockRecord: true,
            quantityOnHand: 12,
            availableQuantity: 8,
            reorderLevel: 4,
            shelfLocation: "A1",
            isLowStock: false,
            usedQuantity: 4,
            returnedQuantity: 0,
            netUsedQuantity: 4,
            remainingUsageQuantity: 0,
            usageHistory: [],
          },
        },
        {
          id: "service-line",
          sourceQuotationItemId: null,
          lineNumber: 2,
          itemType: "service",
          productId: null,
          serviceId: "service-1",
          description: "Change Oil",
          quantity: 1,
          unitPrice: 700,
          total: 700,
          isAdditional: false,
          approvalStatus: "not_required",
          usageStatus: "planned",
          approvedAt: null,
          rejectedAt: null,
          inventoryTracking: null,
        },
        {
          id: "rejected-extra",
          sourceQuotationItemId: null,
          lineNumber: 3,
          itemType: "labor",
          productId: null,
          serviceId: null,
          description: "Extra polishing",
          quantity: 1,
          unitPrice: 300,
          total: 300,
          isAdditional: true,
          approvalStatus: "rejected",
          usageStatus: "cancelled",
          approvedAt: null,
          rejectedAt: "2026-05-08T03:00:00.000Z",
          inventoryTracking: null,
        },
      ],
      billableTotal: 2700,
      rejectedAdditionalTotal: 300,
    } satisfies Pick<JobOrderPrintDetail, "items" | "billableTotal" | "rejectedAdditionalTotal">;

    const result = buildJobOrderPrintBreakdown(jobOrder);

    expect(result.workLines).toHaveLength(3);
    expect(result.totalParts).toBe(2000);
    expect(result.totalLabor).toBe(700);
    expect(result.pendingExtras).toBe(0);
    expect(result.rejectedExtras).toBe(300);
    expect(result.billableTotal).toBe(2700);
    expect(result.partUsageLines).toEqual([
      {
        id: "part-line",
        description: "Engine Oil",
        plannedQuantity: "4",
        usedQuantity: "4",
        returnedQuantity: "0",
        remainingQuantity: "0",
        stockAvailability: "8",
        usageStatus: "used",
      },
    ]);
  });
});
