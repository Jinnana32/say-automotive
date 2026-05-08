import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  buildPaymentMethodBreakdown,
  buildStatusBreakdown,
  buildTopPerformers,
  buildTrendBuckets,
  buildWorkflowFunnel,
  filterByIsoDateRange,
  getPresetDateRange,
  resolveReportFilters,
} from "@/features/reports/utils";

describe("reports utils", () => {
  const fixedNow = DateTime.fromISO("2026-05-08T09:00:00.000+08:00");

  it("resolves preset-based report filters and default grouping", () => {
    const resolved = resolveReportFilters({ preset: "today" }, fixedNow);

    expect(resolved.preset).toBe("today");
    expect(resolved.groupBy).toBe("daily");
    expect(resolved.from).toBe("2026-05-08");
    expect(resolved.to).toBe("2026-05-08");
  });

  it("keeps valid custom ranges and derives grouping from the selected span", () => {
    const resolved = resolveReportFilters(
      {
        preset: "custom",
        from: "2026-05-01",
        to: "2026-05-31",
      },
      fixedNow,
    );

    expect(resolved.preset).toBe("custom");
    expect(resolved.groupBy).toBe("weekly");
    expect(resolved.from).toBe("2026-05-01");
    expect(resolved.to).toBe("2026-05-31");
  });

  it("filters rows by an inclusive date range", () => {
    const rows = [
      { createdAt: "2026-05-01T00:00:00.000+08:00" },
      { createdAt: "2026-05-15T13:00:00.000+08:00" },
      { createdAt: "2026-06-01T00:00:00.000+08:00" },
    ];

    const filtered = filterByIsoDateRange(rows, {
      getDate: (row) => row.createdAt,
      fromIso: "2026-05-01T00:00:00.000+08:00",
      toIso: "2026-05-31T23:59:59.999+08:00",
    });

    expect(filtered).toHaveLength(2);
  });

  it("builds daily, weekly, and monthly trend buckets", () => {
    expect(
      buildTrendBuckets({
        from: "2026-05-01",
        to: "2026-05-03",
        groupBy: "daily",
      }),
    ).toHaveLength(3);

    expect(
      buildTrendBuckets({
        from: "2026-05-01",
        to: "2026-05-31",
        groupBy: "weekly",
      }).length,
    ).toBeGreaterThan(3);

    expect(
      buildTrendBuckets({
        from: "2026-05-01",
        to: "2026-07-31",
        groupBy: "monthly",
      }),
    ).toHaveLength(3);
  });

  it("builds status and payment breakdowns", () => {
    expect(buildStatusBreakdown(["pending", "pending", "released"])).toEqual([
      { label: "pending", count: 2 },
      { label: "released", count: 1 },
    ]);

    expect(
      buildPaymentMethodBreakdown([
        { paymentMethod: "cash", amount: 1000 },
        { paymentMethod: "cash", amount: 500 },
        { paymentMethod: "gcash", amount: 700 },
      ]),
    ).toEqual([
      { label: "cash", amount: 1500, count: 2 },
      { label: "gcash", amount: 700, count: 1 },
    ]);
  });

  it("aggregates top performers and workflow steps", () => {
    expect(
      buildTopPerformers([
        { label: "Change Oil", quantity: 1, amount: 700 },
        { label: "Change Oil", quantity: 2, amount: 1400 },
        { label: "Brake Cleaning", quantity: 1, amount: 500 },
      ]),
    ).toEqual([
      { label: "Change Oil", quantity: 3, amount: 2100 },
      { label: "Brake Cleaning", quantity: 1, amount: 500 },
    ]);

    expect(
      buildWorkflowFunnel({
        quotationsCreated: 10,
        quotationsApproved: 6,
        jobOrdersOpened: 5,
        vehiclesReleased: 4,
        invoicesWithPaymentActivity: 3,
        paymentsCollected: 5800,
      }),
    ).toEqual([
      { label: "Quotations created", count: 10 },
      { label: "Quotations approved", count: 6 },
      { label: "Job orders opened", count: 5 },
      { label: "Vehicles released", count: 4 },
      { label: "Invoices with payments", count: 3, helper: "₱5,800.00 collected" },
    ]);
  });

  it("returns expected presets for current periods", () => {
    const monthRange = getPresetDateRange("this-month", fixedNow);

    expect(monthRange.defaultGroupBy).toBe("weekly");
    expect(monthRange.from.toISODate()).toBe("2026-05-01");
    expect(monthRange.to.toISODate()).toBe("2026-05-08");
  });
});
