import { describe, expect, it } from "vitest";

import {
  branchHolidaySchema,
  philippineHolidayImportSchema,
} from "@/features/attendance/schemas/branch-holiday-schema";

describe("branchHolidaySchema", () => {
  it("rejects incomplete holiday entries", () => {
    const result = branchHolidaySchema.safeParse({
      holidayId: "",
      holidayDate: "2026-13-40",
      label: "",
      holidayKind: "invalid",
      payTreatment: "invalid",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("philippineHolidayImportSchema", () => {
  it("requires at least one selected importable holiday", () => {
    const result = philippineHolidayImportSchema.safeParse({
      year: 2026,
      selections: [],
    });

    expect(result.success).toBe(false);
  });
});
