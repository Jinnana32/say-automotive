import type {
  BranchHolidayKind,
  BranchHolidayPayTreatment,
  BranchHolidaySummary,
  PhilippineHolidaySuggestion,
  PhilippineHolidaySuggestionRow,
  PhilippineHolidaySuggestionType,
} from "@/features/attendance/types";

const PHILIPPINE_HOLIDAYS_BY_YEAR: Record<number, PhilippineHolidaySuggestion[]> = {
  2026: [
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-01-01",
      label: "New Year's Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-02-17",
      label: "Chinese New Year",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-02-25",
      label: "EDSA People Power Revolution Anniversary",
      officialType: "special_working_day",
      holidayKind: null,
      defaultPayTreatment: null,
      importable: false,
      notes: "Special working day; keep this unselected unless management needs a manual reminder only.",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-04-02",
      label: "Maundy Thursday",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-04-03",
      label: "Good Friday",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-04-04",
      label: "Black Saturday",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-04-09",
      label: "Araw ng Kagitingan",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-05-01",
      label: "Labor Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-06-12",
      label: "Independence Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-08-21",
      label: "Ninoy Aquino Day",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-08-31",
      label: "National Heroes Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-11-01",
      label: "All Saints' Day",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-11-02",
      label: "All Souls' Day",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-11-30",
      label: "Bonifacio Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-12-08",
      label: "Feast of the Immaculate Conception of Mary",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-12-24",
      label: "Christmas Eve",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-12-25",
      label: "Christmas Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-12-30",
      label: "Rizal Day",
      officialType: "regular_holiday",
      holidayKind: "public_holiday",
      defaultPayTreatment: "paid_regular_day",
    }),
    buildSuggestion({
      year: 2026,
      holidayDate: "2026-12-31",
      label: "Last Day of the Year",
      officialType: "special_non_working_holiday",
      holidayKind: "special_non_working_day",
      defaultPayTreatment: "custom",
    }),
  ],
};

export function getPhilippineHolidayImportYears(referenceYear: number) {
  return Array.from(
    new Set([referenceYear - 1, referenceYear, referenceYear + 1, ...Object.keys(PHILIPPINE_HOLIDAYS_BY_YEAR).map(Number)]),
  ).sort((left, right) => left - right);
}

export function getPhilippineHolidaySuggestionsForYear(year: number) {
  return PHILIPPINE_HOLIDAYS_BY_YEAR[year] ?? [];
}

export function buildPhilippineHolidaySuggestionRows(params: {
  year: number;
  existingHolidays: BranchHolidaySummary[];
}) {
  const existingDates = new Set(
    params.existingHolidays.map((holiday) => holiday.holidayDate),
  );

  return getPhilippineHolidaySuggestionsForYear(params.year).map<PhilippineHolidaySuggestionRow>((suggestion) => {
    const alreadyAdded = existingDates.has(suggestion.holidayDate);
    const selectable = suggestion.importable && !alreadyAdded;

    return {
      ...suggestion,
      alreadyAdded,
      selectable,
      selectedByDefault: selectable,
    };
  });
}

export function formatPhilippineHolidaySuggestionTypeLabel(type: PhilippineHolidaySuggestionType) {
  switch (type) {
    case "regular_holiday":
      return "Regular Holiday";
    case "special_non_working_holiday":
      return "Special Non-working Holiday";
    case "special_working_day":
      return "Special Working Day";
  }
}

export function formatPhilippineHolidaySuggestionPayTreatmentLabel(
  suggestion: Pick<PhilippineHolidaySuggestion, "defaultPayTreatment" | "importable">,
) {
  if (!suggestion.importable || !suggestion.defaultPayTreatment) {
    return "Not imported";
  }

  switch (suggestion.defaultPayTreatment) {
    case "paid_regular_day":
      return "Paid regular day";
    case "custom":
      return "Custom pay rule";
    case "unpaid":
      return "Unpaid";
  }
}

export function isPhilippineHolidaySuggestionImportable(
  suggestion: PhilippineHolidaySuggestion,
): suggestion is PhilippineHolidaySuggestion & {
  importable: true;
  holidayKind: BranchHolidayKind;
  defaultPayTreatment: BranchHolidayPayTreatment;
} {
  return suggestion.importable
    && suggestion.holidayKind !== null
    && suggestion.defaultPayTreatment !== null;
}

function buildSuggestion(
  suggestion: Omit<PhilippineHolidaySuggestion, "id" | "importable" | "notes"> & {
    importable?: boolean;
    notes?: string | null;
  },
): PhilippineHolidaySuggestion {
  return {
    id: `${suggestion.year}-${suggestion.holidayDate}-${slugifyHolidayLabel(suggestion.label)}`,
    importable: suggestion.importable ?? true,
    notes: suggestion.notes ?? null,
    ...suggestion,
  };
}

function slugifyHolidayLabel(label: string) {
  return label
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}
