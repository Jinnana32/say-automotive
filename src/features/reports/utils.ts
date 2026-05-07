import { DateTime } from "luxon";

import type {
  PaymentMethodBreakdownItem,
  ReportWindow,
  StatusBreakdownItem,
} from "@/features/reports/types";

const REPORT_WINDOW_DAYS: Record<Exclude<ReportWindow, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function getReportWindowStart(window: ReportWindow, nowIso: string) {
  if (window === "all") {
    return null;
  }

  return DateTime.fromISO(nowIso).minus({ days: REPORT_WINDOW_DAYS[window] }).toISO();
}

export function filterByIsoDate<T>(
  rows: T[],
  params: {
    getDate: (row: T) => string | null | undefined;
    windowStartIso: string | null;
  },
) {
  if (!params.windowStartIso) {
    return rows;
  }

  const start = DateTime.fromISO(params.windowStartIso);

  return rows.filter((row) => {
    const dateValue = params.getDate(row);

    if (!dateValue) {
      return false;
    }

    return DateTime.fromISO(dateValue) >= start;
  });
}

export function buildStatusBreakdown<T extends string>(
  rows: T[],
): StatusBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row, (counts.get(row) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label: label.replaceAll("_", " "), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function buildPaymentMethodBreakdown<T extends string>(
  rows: {
    paymentMethod: T;
    amount: number;
  }[],
): PaymentMethodBreakdownItem[] {
  const summary = new Map<string, { amount: number; count: number }>();

  for (const row of rows) {
    const current = summary.get(row.paymentMethod) ?? { amount: 0, count: 0 };
    summary.set(row.paymentMethod, {
      amount: Number((current.amount + row.amount).toFixed(2)),
      count: current.count + 1,
    });
  }

  return [...summary.entries()]
    .map(([label, value]) => ({
      label: label.replaceAll("_", " "),
      amount: value.amount,
      count: value.count,
    }))
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label));
}
