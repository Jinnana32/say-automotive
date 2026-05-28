import { DateTime } from "luxon";

const SCHEDULE_TIME_FORMATS = [
  "HH:mm:ss",
  "HH:mm",
  "hh:mm:ss a",
  "h:mm:ss a",
  "hh:mm a",
  "h:mm a",
] as const;

export function parseStaffScheduleTime(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  for (const format of SCHEDULE_TIME_FORMATS) {
    const parsed = DateTime.fromFormat(trimmedValue, format);

    if (parsed.isValid) {
      return parsed;
    }
  }

  return null;
}

export function isValidStaffScheduleTime(value: string | null | undefined) {
  return parseStaffScheduleTime(value) !== null;
}

export function normalizeStaffScheduleTimeInput(
  value: string | null | undefined,
  fallbackValue: string,
) {
  const parsed = parseStaffScheduleTime(value);
  return parsed ? parsed.toFormat("HH:mm") : fallbackValue;
}

export function formatStaffScheduleTimeForStorage(value: string) {
  const parsed = parseStaffScheduleTime(value);

  if (!parsed) {
    throw new Error(`Invalid schedule time: ${value}`);
  }

  return parsed.toFormat("HH:mm:ss");
}
