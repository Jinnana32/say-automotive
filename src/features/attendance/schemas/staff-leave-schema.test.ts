import { describe, expect, it } from "vitest";

import { staffLeaveSchema } from "@/features/attendance/schemas/staff-leave-schema";

describe("staffLeaveSchema", () => {
  it("rejects leave ranges where the end date comes first", () => {
    const result = staffLeaveSchema.safeParse({
      leaveEntryId: "",
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      startDate: "2026-05-10",
      endDate: "2026-05-08",
      leaveType: "vacation",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
