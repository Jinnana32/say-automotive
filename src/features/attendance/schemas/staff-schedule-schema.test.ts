import { describe, expect, it } from "vitest";

import { staffScheduleSchema } from "@/features/attendance/schemas/staff-schedule-schema";

describe("staffScheduleSchema", () => {
  it("requires at least one workday and a valid time range", () => {
    const result = staffScheduleSchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      shiftStartTime: "17:00",
      shiftEndTime: "08:00",
      graceMinutes: "10",
      mondayIsWorkday: false,
      tuesdayIsWorkday: false,
      wednesdayIsWorkday: false,
      thursdayIsWorkday: false,
      fridayIsWorkday: false,
      saturdayIsWorkday: false,
      sundayIsWorkday: false,
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts common schedule time formats used by the form and stored records", () => {
    const result = staffScheduleSchema.safeParse({
      staffId: "6f85967c-31db-43ae-8d70-cdb34abd57b2",
      shiftStartTime: "07:00:00",
      shiftEndTime: "05:00 PM",
      graceMinutes: "0",
      mondayIsWorkday: true,
      tuesdayIsWorkday: true,
      wednesdayIsWorkday: true,
      thursdayIsWorkday: true,
      fridayIsWorkday: true,
      saturdayIsWorkday: true,
      sundayIsWorkday: false,
      notes: "",
    });

    expect(result.success).toBe(true);
  });
});
