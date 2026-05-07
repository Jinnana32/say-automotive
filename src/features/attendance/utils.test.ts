import { describe, expect, it } from "vitest";

import { computeExpectedWorkdaySummary } from "@/features/attendance/utils";

describe("computeExpectedWorkdaySummary", () => {
  it("subtracts branch holidays and approved leave from scheduled workdays without double counting", () => {
    const result = computeExpectedWorkdaySummary({
      schedule: {
        id: "schedule-1",
        staffId: "staff-1",
        shiftStartTime: "08:00:00",
        shiftEndTime: "17:00:00",
        graceMinutes: 10,
        mondayIsWorkday: true,
        tuesdayIsWorkday: true,
        wednesdayIsWorkday: true,
        thursdayIsWorkday: true,
        fridayIsWorkday: true,
        saturdayIsWorkday: false,
        sundayIsWorkday: false,
        notes: null,
      },
      startDate: "2026-05-04",
      endDate: "2026-05-08",
      holidayDates: ["2026-05-05", "2026-05-08"],
      leaveEntries: [
        {
          startDate: "2026-05-06",
          endDate: "2026-05-07",
        },
        {
          startDate: "2026-05-08",
          endDate: "2026-05-08",
        },
      ],
    });

    expect(result.scheduledWorkdayCount).toBe(5);
    expect(result.holidayDayCount).toBe(2);
    expect(result.approvedLeaveDayCount).toBe(2);
    expect(result.expectedWorkdayCount).toBe(1);
  });
});
