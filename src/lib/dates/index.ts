import { DateTime } from "luxon";

const BUSINESS_TIMEZONE = "Asia/Manila";

export function getBusinessNow() {
  return DateTime.now().setZone(BUSINESS_TIMEZONE);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "N/A";
  }

  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value))
    .setZone(BUSINESS_TIMEZONE)
    .toFormat("LLL dd, yyyy");
}

export function formatDocumentDate(value: string | Date | null | undefined) {
  if (!value) {
    return "N/A";
  }

  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value))
    .setZone(BUSINESS_TIMEZONE)
    .toFormat("MM/dd/yyyy");
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "N/A";
  }

  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value))
    .setZone(BUSINESS_TIMEZONE)
    .toFormat("LLL dd, yyyy hh:mm a");
}

export function toUtcIso(value: string) {
  return DateTime.fromISO(value, { zone: BUSINESS_TIMEZONE }).toUTC().toISO();
}

export function fromUtcIso(value: string) {
  return DateTime.fromISO(value, { zone: "utc" }).setZone(BUSINESS_TIMEZONE);
}
