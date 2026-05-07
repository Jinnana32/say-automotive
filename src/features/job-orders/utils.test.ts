import { describe, expect, it } from "vitest";

import {
  buildJobOrderItemInventoryTracking,
  calculateJobOrderBillableTotal,
  calculateJobOrderPendingApprovalCount,
  calculateJobOrderPendingApprovalTotal,
  getAllowedJobOrderStatusTransitions,
} from "@/features/job-orders/utils";

const items = [
  {
    id: "1",
    sourceQuotationItemId: null,
    lineNumber: 1,
    itemType: "service" as const,
    productId: null,
    serviceId: "service-1",
    description: "Oil change",
    quantity: 1,
    unitPrice: 800,
    total: 800,
    isAdditional: false,
    approvalStatus: "not_required" as const,
    usageStatus: "planned" as const,
    approvedAt: null,
    rejectedAt: null,
    inventoryTracking: null,
  },
  {
    id: "2",
    sourceQuotationItemId: null,
    lineNumber: 2,
    itemType: "product" as const,
    productId: "product-1",
    serviceId: null,
    description: "Brake pads",
    quantity: 1,
    unitPrice: 1500,
    total: 1500,
    isAdditional: true,
    approvalStatus: "pending" as const,
    usageStatus: "planned" as const,
    approvedAt: null,
    rejectedAt: null,
    inventoryTracking: null,
  },
  {
    id: "3",
    sourceQuotationItemId: null,
    lineNumber: 3,
    itemType: "labor" as const,
    productId: null,
    serviceId: null,
    description: "Extra labor",
    quantity: 1,
    unitPrice: 600,
    total: 600,
    isAdditional: true,
    approvalStatus: "approved" as const,
    usageStatus: "planned" as const,
    approvedAt: null,
    rejectedAt: null,
    inventoryTracking: null,
  },
];

describe("job order utils", () => {
  it("calculates billable and pending totals from approval states", () => {
    expect(calculateJobOrderBillableTotal(items)).toBe(1400);
    expect(calculateJobOrderPendingApprovalCount(items)).toBe(1);
    expect(calculateJobOrderPendingApprovalTotal(items)).toBe(1500);
  });

  it("returns the operationally allowed next statuses", () => {
    expect(getAllowedJobOrderStatusTransitions("pending")).toEqual(["in_progress", "cancelled"]);
    expect(getAllowedJobOrderStatusTransitions("completed")).toEqual(["ready_for_billing"]);
    expect(getAllowedJobOrderStatusTransitions("released")).toEqual([]);
  });

  it("builds inventory tracking from usage history and stock state", () => {
    const tracking = buildJobOrderItemInventoryTracking({
      plannedQuantity: 3,
      hasStockRecord: true,
      quantityOnHand: 8,
      availableQuantity: 2,
      reorderLevel: 3,
      shelfLocation: "A-01",
      usageHistory: [
        {
          id: "usage-1",
          usageType: "use",
          quantity: 2,
          notes: null,
          createdAt: "2026-05-01T00:00:00.000Z",
          previousQuantity: 10,
          newQuantity: 8,
        },
        {
          id: "usage-2",
          usageType: "return",
          quantity: 1,
          notes: null,
          createdAt: "2026-05-01T01:00:00.000Z",
          previousQuantity: 8,
          newQuantity: 9,
        },
      ],
    });

    expect(tracking.usedQuantity).toBe(2);
    expect(tracking.returnedQuantity).toBe(1);
    expect(tracking.netUsedQuantity).toBe(1);
    expect(tracking.remainingUsageQuantity).toBe(2);
    expect(tracking.isLowStock).toBe(true);
  });
});
