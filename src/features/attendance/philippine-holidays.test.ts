import { describe, expect, it } from "vitest";

import {
  buildPhilippineHolidaySuggestionRows,
  formatPhilippineHolidaySuggestionTypeLabel,
  getPhilippineHolidayImportYears,
  getPhilippineHolidaySuggestionsForYear,
} from "@/features/attendance/philippine-holidays";

describe("getPhilippineHolidayImportYears", () => {
  it("includes the current year plus adjacent years for review", () => {
    expect(getPhilippineHolidayImportYears(2026)).toEqual([2025, 2026, 2027]);
  });
});

describe("getPhilippineHolidaySuggestionsForYear", () => {
  it("returns the official 2026 national holiday suggestions", () => {
    const suggestions = getPhilippineHolidaySuggestionsForYear(2026);

    expect(suggestions).toHaveLength(19);
    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          holidayDate: "2026-01-01",
          label: "New Year's Day",
          officialType: "regular_holiday",
          importable: true,
        }),
        expect.objectContaining({
          holidayDate: "2026-02-25",
          label: "EDSA People Power Revolution Anniversary",
          officialType: "special_working_day",
          importable: false,
        }),
      ]),
    );
  });
});

describe("buildPhilippineHolidaySuggestionRows", () => {
  it("marks existing branch dates as already added and not selectable", () => {
    const rows = buildPhilippineHolidaySuggestionRows({
      year: 2026,
      existingHolidays: [
        {
          id: "holiday-1",
          branchId: "branch-1",
          holidayDate: "2026-01-01",
          label: "Custom New Year",
          holidayKind: "public_holiday",
          payTreatment: "paid_regular_day",
          notes: null,
        },
      ],
    });

    const newYear = rows.find((row) => row.holidayDate === "2026-01-01");
    const edsa = rows.find((row) => row.holidayDate === "2026-02-25");

    expect(newYear).toEqual(
      expect.objectContaining({
        alreadyAdded: true,
        selectable: false,
        selectedByDefault: false,
      }),
    );
    expect(edsa).toEqual(
      expect.objectContaining({
        alreadyAdded: false,
        selectable: false,
        selectedByDefault: false,
      }),
    );
  });
});

describe("formatPhilippineHolidaySuggestionTypeLabel", () => {
  it("formats the suggestion type for table display", () => {
    expect(formatPhilippineHolidaySuggestionTypeLabel("special_non_working_holiday")).toBe(
      "Special Non-working Holiday",
    );
  });
});
