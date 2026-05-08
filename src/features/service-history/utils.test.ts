import { describe, expect, it } from "vitest";

import {
  buildServiceHistoryItems,
  buildServiceHistorySummary,
  buildUsageQuantityMap,
  resolveServiceHistoryPhase,
} from "@/features/service-history/utils";
import type { ServiceHistoryEntry } from "@/features/service-history/types";

describe("service history utils", () => {
  it("classifies active and completed job-order phases", () => {
    expect(resolveServiceHistoryPhase("in_progress")).toBe("active");
    expect(resolveServiceHistoryPhase("released")).toBe("history");
    expect(resolveServiceHistoryPhase("cancelled")).toBeNull();
  });

  it("prefers actual product usage and keeps rejected extras separate", () => {
    const usageQuantityByItemId = buildUsageQuantityMap([
      {
        jobOrderItemId: "product-used",
        usageType: "use",
        quantity: 2,
      },
      {
        jobOrderItemId: "product-used",
        usageType: "return",
        quantity: 0.5,
      },
    ]);

    const result = buildServiceHistoryItems({
      items: [
        {
          id: "service",
          sourceQuotationItemId: null,
          lineNumber: 1,
          itemType: "service",
          productId: null,
          serviceId: "svc-1",
          description: "Change oil",
          quantity: 1,
          unitPrice: 900,
          total: 900,
          isAdditional: false,
          approvalStatus: "not_required",
          usageStatus: "planned",
          approvedAt: null,
          rejectedAt: null,
          inventoryTracking: null,
        },
        {
          id: "product-used",
          sourceQuotationItemId: null,
          lineNumber: 2,
          itemType: "product",
          productId: "prod-1",
          serviceId: null,
          description: "Engine oil",
          quantity: 4,
          unitPrice: 300,
          total: 1200,
          isAdditional: false,
          approvalStatus: "approved",
          usageStatus: "used",
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
          description: "Additional cleaning",
          quantity: 1,
          unitPrice: 250,
          total: 250,
          isAdditional: true,
          approvalStatus: "rejected",
          usageStatus: "planned",
          approvedAt: null,
          rejectedAt: null,
          inventoryTracking: null,
        },
      ],
      usageQuantityByItemId,
    });

    expect(result.services).toHaveLength(1);
    expect(result.partsUsed).toEqual([
      expect.objectContaining({
        id: "product-used",
        quantity: 1.5,
        usageSource: "actual",
      }),
    ]);
    expect(result.rejectedExtras).toEqual([
      expect.objectContaining({
        id: "rejected-extra",
      }),
    ]);
  });

  it("builds a concise summary from the richest available note", () => {
    const entry = {
      id: "jo-1",
      vehicleId: "veh-1",
      vehicleLabel: "Toyota Vios",
      customerId: "cust-1",
      jobOrderId: "jo-1",
      jobOrderNumber: "JO-0001",
      status: "released",
      phase: "history",
      serviceDate: "2026-05-08T00:00:00.000+08:00",
      createdAt: "2026-05-08T00:00:00.000+08:00",
      startedAt: null,
      completedAt: null,
      releasedAt: null,
      customerConcern: "Engine noise",
      inspectionNotes: null,
      diagnosis: "Loose belt",
      workPerformed: "Adjusted and tightened the accessory belt",
      mileageIn: null,
      mileageOut: null,
      services: [],
      partsUsed: [],
      rejectedExtras: [],
      mechanics: [],
      invoice: null,
      quotation: null,
      totalAmount: 0,
      paymentMethod: null,
    } satisfies ServiceHistoryEntry;

    expect(buildServiceHistorySummary(entry)).toBe("Adjusted and tightened the accessory belt");
  });
});
