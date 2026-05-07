import { describe, expect, it } from "vitest";

import {
  buildPaymentMethodBreakdown,
  buildStatusBreakdown,
  filterByIsoDate,
  getReportWindowStart,
} from "@/features/reports/utils";

describe("reports utils", () => {
  it("calculates a report window start when needed", () => {
    expect(getReportWindowStart("all", "2026-05-01T00:00:00.000+08:00")).toBeNull();
    expect(getReportWindowStart("7d", "2026-05-01T00:00:00.000+08:00")).toContain("2026-04");
  });

  it("filters rows by the selected date window", () => {
    const rows = [
      { createdAt: "2026-05-01T00:00:00.000+08:00" },
      { createdAt: "2026-03-01T00:00:00.000+08:00" },
    ];

    const filtered = filterByIsoDate(rows, {
      getDate: (row) => row.createdAt,
      windowStartIso: "2026-04-01T00:00:00.000+08:00",
    });

    expect(filtered).toHaveLength(1);
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
});
