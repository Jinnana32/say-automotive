import { describe, expect, it } from "vitest";

import { compensationProfileSchema, payrollPeriodSchema } from "@/features/payroll/schemas/payroll-schemas";

describe("compensationProfileSchema", () => {
  it("requires a valid base rate and effective date", () => {
    const result = compensationProfileSchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      payBasis: "daily",
      baseRate: "",
      overtimeRate: "-1",
      allowancePerPeriod: "0",
      effectiveStartDate: "",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("payrollPeriodSchema", () => {
  it("rejects payout dates before the coverage end date", () => {
    const result = payrollPeriodSchema.safeParse({
      label: "Payroll May 2026",
      periodStartDate: "2026-05-01",
      periodEndDate: "2026-05-15",
      payoutDate: "2026-05-10",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
