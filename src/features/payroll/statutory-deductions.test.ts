import { describe, expect, it } from "vitest";

import {
  buildStatutoryDeductionLines,
  isStatutoryDeductionLabel,
  resolveEffectiveStatutoryAmounts,
  STATUTORY_DEDUCTION_LABELS,
} from "@/features/payroll/statutory-deductions";

describe("buildStatutoryDeductionLines", () => {
  it("includes only positive employee contribution amounts", () => {
    expect(
      buildStatutoryDeductionLines({
        sssEeAmount: 135,
        philhealthEeAmount: 0,
        pagibigEeAmount: 100,
      }),
    ).toEqual([
      { label: STATUTORY_DEDUCTION_LABELS.sss, amount: 135 },
      { label: STATUTORY_DEDUCTION_LABELS.pagibig, amount: 100 },
    ]);
  });

  it("returns an empty list when all amounts are zero", () => {
    expect(
      buildStatutoryDeductionLines({
        sssEeAmount: 0,
        philhealthEeAmount: 0,
        pagibigEeAmount: 0,
      }),
    ).toEqual([]);
  });
});

describe("resolveEffectiveStatutoryAmounts", () => {
  it("uses shop defaults when the staff profile opts into branch defaults", () => {
    expect(
      resolveEffectiveStatutoryAmounts({
        useBranchDefaults: true,
        profileAmounts: {
          sssEeAmount: 50,
          philhealthEeAmount: 25,
          pagibigEeAmount: 10,
        },
        branchDefaults: {
          sssEeAmount: 500,
          philhealthEeAmount: 400,
          pagibigEeAmount: 100,
        },
      }),
    ).toEqual({
      sssEeAmount: 500,
      philhealthEeAmount: 400,
      pagibigEeAmount: 100,
    });
  });

  it("uses custom profile amounts when branch defaults are disabled", () => {
    expect(
      resolveEffectiveStatutoryAmounts({
        useBranchDefaults: false,
        profileAmounts: {
          sssEeAmount: 50,
          philhealthEeAmount: 25,
          pagibigEeAmount: 10,
        },
        branchDefaults: {
          sssEeAmount: 500,
          philhealthEeAmount: 400,
          pagibigEeAmount: 100,
        },
      }),
    ).toEqual({
      sssEeAmount: 50,
      philhealthEeAmount: 25,
      pagibigEeAmount: 10,
    });
  });
});

describe("isStatutoryDeductionLabel", () => {
  it("recognizes system-managed contribution labels", () => {
    expect(isStatutoryDeductionLabel("SSS contribution")).toBe(true);
    expect(isStatutoryDeductionLabel("PhilHealth contribution")).toBe(true);
    expect(isStatutoryDeductionLabel("Pag-IBIG contribution")).toBe(true);
    expect(isStatutoryDeductionLabel("Cash advance")).toBe(false);
  });
});
