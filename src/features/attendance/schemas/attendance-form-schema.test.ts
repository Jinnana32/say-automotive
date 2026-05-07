import { describe, expect, it } from "vitest";

import { attendanceEntrySchema } from "@/features/attendance/schemas/attendance-form-schema";

describe("attendanceEntrySchema", () => {
  it("accepts a valid attendance entry", () => {
    const result = attendanceEntrySchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      attendanceDate: "2026-05-07",
      status: "present",
      timeIn: "2026-05-07T08:00",
      timeOut: "2026-05-07T17:00",
      notes: "Normal shift.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a time out without a time in", () => {
    const result = attendanceEntrySchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      attendanceDate: "2026-05-07",
      status: "present",
      timeIn: "",
      timeOut: "2026-05-07T17:00",
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects absent records with logged times", () => {
    const result = attendanceEntrySchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      attendanceDate: "2026-05-07",
      status: "absent",
      timeIn: "2026-05-07T08:00",
      timeOut: "",
      notes: "",
    });

    expect(result.success).toBe(false);
  });
});
