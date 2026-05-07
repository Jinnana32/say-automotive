import { describe, expect, it } from "vitest";

import { branchHolidaySchema } from "@/features/attendance/schemas/branch-holiday-schema";

describe("branchHolidaySchema", () => {
  it("rejects incomplete holiday entries", () => {
    const result = branchHolidaySchema.safeParse({
      holidayId: "",
      holidayDate: "2026-13-40",
      label: "",
      holidayKind: "invalid",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
