import { DateTime } from "luxon";

import { formatPaymentMethod } from "@/features/invoices/utils";
import type { PaymentMethod } from "@/features/invoices/types";
import type {
  PaymentMethodBreakdownItem,
  ReportGroupBy,
  ReportPreset,
  ReportsFilterState,
  RevenueTrendPoint,
  StatusBreakdownItem,
  TopPerformerItem,
  WorkflowFunnelStep,
} from "@/features/reports/types";
import { formatCurrencyNumber, roundCurrency } from "@/lib/currency";

const BUSINESS_TIMEZONE = "Asia/Manila";

export function getPresetDateRange(
  preset: ReportPreset,
  now: DateTime = DateTime.now().setZone(BUSINESS_TIMEZONE),
): {
  from: DateTime;
  to: DateTime;
  defaultGroupBy: ReportGroupBy;
} {
  switch (preset) {
    case "today":
      return {
        from: now.startOf("day"),
        to: now.endOf("day"),
        defaultGroupBy: "daily" as const,
      };
    case "this-week":
      return {
        from: now.startOf("week"),
        to: now.endOf("day"),
        defaultGroupBy: "daily" as const,
      };
    case "this-month":
      return {
        from: now.startOf("month"),
        to: now.endOf("day"),
        defaultGroupBy: "weekly" as const,
      };
    case "last-30-days":
      return {
        from: now.minus({ days: 29 }).startOf("day"),
        to: now.endOf("day"),
        defaultGroupBy: "daily" as const,
      };
    case "custom":
      return {
        from: now.minus({ days: 29 }).startOf("day"),
        to: now.endOf("day"),
        defaultGroupBy: "weekly" as const,
      };
  }
}

export function resolveReportFilters(
  input: {
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
  },
  now: DateTime = DateTime.now().setZone(BUSINESS_TIMEZONE),
): ReportsFilterState {
  const preset = isReportPreset(input.preset) ? input.preset : "last-30-days";

  let range = getPresetDateRange(preset, now);

  if (preset === "custom") {
    const parsedFrom = parseBusinessDate(input.from);
    const parsedTo = parseBusinessDate(input.to);

    if (parsedFrom && parsedTo && parsedFrom <= parsedTo) {
      range = {
        from: parsedFrom.startOf("day"),
        to: parsedTo.endOf("day"),
        defaultGroupBy: getDefaultGroupByForCustomRange(parsedFrom, parsedTo),
      };
    }
  }

  const groupBy = isReportGroupBy(input.groupBy)
    ? input.groupBy
    : range.defaultGroupBy;

  return {
    preset,
    from: range.from.toISODate() ?? now.toISODate() ?? "",
    to: range.to.toISODate() ?? now.toISODate() ?? "",
    groupBy,
    periodLabel: `${formatDateLabel(range.from)} to ${formatDateLabel(range.to)}`,
  };
}

export function getReportRangeBounds(filters: Pick<ReportsFilterState, "from" | "to">) {
  const from = DateTime.fromISO(filters.from, { zone: BUSINESS_TIMEZONE }).startOf("day");
  const to = DateTime.fromISO(filters.to, { zone: BUSINESS_TIMEZONE }).endOf("day");

  return {
    from,
    to,
    fromIso: from.toISO() ?? "",
    toIso: to.toISO() ?? "",
  };
}

export function filterByIsoDateRange<T>(
  rows: T[],
  params: {
    getDate: (row: T) => string | null | undefined;
    fromIso: string;
    toIso: string;
  },
) {
  const start = DateTime.fromISO(params.fromIso);
  const end = DateTime.fromISO(params.toIso);

  return rows.filter((row) => {
    const dateValue = params.getDate(row);

    if (!dateValue) {
      return false;
    }

    const value = DateTime.fromISO(dateValue);
    return value >= start && value <= end;
  });
}

export function buildStatusBreakdown<T extends string>(rows: T[]): StatusBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row, (counts.get(row) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label: label.replaceAll("_", " "), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function buildPaymentMethodBreakdown(
  rows: {
    paymentMethod: PaymentMethod;
    amount: number;
  }[],
): PaymentMethodBreakdownItem[] {
  const summary = new Map<string, { amount: number; count: number }>();

  for (const row of rows) {
    const current = summary.get(row.paymentMethod) ?? { amount: 0, count: 0 };
    summary.set(row.paymentMethod, {
      amount: roundCurrency(current.amount + row.amount),
      count: current.count + 1,
    });
  }

  return [...summary.entries()]
    .map(([label, value]) => ({
      label: formatPaymentMethod(label as PaymentMethod),
      amount: value.amount,
      count: value.count,
    }))
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label));
}

export function buildTrendBuckets(
  filters: Pick<ReportsFilterState, "from" | "to" | "groupBy">,
): Array<{
  key: string;
  label: string;
  fromIso: string;
  toIso: string;
}> {
  const { from, to } = getReportRangeBounds(filters);
  const buckets: Array<{
    key: string;
    label: string;
    fromIso: string;
    toIso: string;
  }> = [];

  if (filters.groupBy === "daily") {
    let cursor = from.startOf("day");
    while (cursor <= to) {
      buckets.push({
        key: cursor.toISODate() ?? String(buckets.length),
        label: cursor.toFormat("LLL dd"),
        fromIso: cursor.startOf("day").toISO() ?? "",
        toIso: cursor.endOf("day").toISO() ?? "",
      });
      cursor = cursor.plus({ days: 1 });
    }
    return buckets;
  }

  if (filters.groupBy === "weekly") {
    let cursor = from.startOf("week");
    const end = to.endOf("week");
    while (cursor <= end) {
      buckets.push({
        key: cursor.toISODate() ?? String(buckets.length),
        label: `Week of ${cursor.toFormat("LLL dd")}`,
        fromIso: cursor.startOf("week").toISO() ?? "",
        toIso: cursor.endOf("week").toISO() ?? "",
      });
      cursor = cursor.plus({ weeks: 1 });
    }
    return buckets;
  }

  let cursor = from.startOf("month");
  const end = to.endOf("month");
  while (cursor <= end) {
    buckets.push({
      key: cursor.toFormat("yyyy-LL"),
      label: cursor.toFormat("LLL yyyy"),
      fromIso: cursor.startOf("month").toISO() ?? "",
      toIso: cursor.endOf("month").toISO() ?? "",
    });
    cursor = cursor.plus({ months: 1 });
  }

  return buckets;
}

export function buildRevenueTrend<TQuotation, TRelease>(params: {
  buckets: Array<{
    key: string;
    label: string;
    fromIso: string;
    toIso: string;
  }>;
  approvedQuotations: TQuotation[];
  releases: TRelease[];
  getApprovedDate: (row: TQuotation) => string;
  getApprovedAmount: (row: TQuotation) => number;
  getReleaseDate: (row: TRelease) => string;
}): RevenueTrendPoint[] {
  return params.buckets.map((bucket) => {
    const bucketApprovals = filterByIsoDateRange(params.approvedQuotations, {
      getDate: params.getApprovedDate,
      fromIso: bucket.fromIso,
      toIso: bucket.toIso,
    });
    const bucketReleases = filterByIsoDateRange(params.releases, {
      getDate: params.getReleaseDate,
      fromIso: bucket.fromIso,
      toIso: bucket.toIso,
    });

    return {
      key: bucket.key,
      label: bucket.label,
      approvedQuotationValue: roundCurrency(
        bucketApprovals.reduce((sum, row) => sum + params.getApprovedAmount(row), 0),
      ),
      vehiclesReleased: bucketReleases.length,
    };
  });
}

export function buildWorkflowFunnel(params: {
  quotationsCreated: number;
  quotationsApproved: number;
  approvedQuotationValue: number;
  jobOrdersOpened: number;
  vehiclesReleased: number;
}): WorkflowFunnelStep[] {
  return [
    { label: "Quotations created", count: params.quotationsCreated },
    {
      label: "Quotations approved",
      count: params.quotationsApproved,
      helper: `₱${formatCurrencyNumber(params.approvedQuotationValue)} approved value`,
    },
    { label: "Job orders opened", count: params.jobOrdersOpened },
    { label: "Vehicles released", count: params.vehiclesReleased },
  ];
}

export function buildTopPerformers(
  rows: Array<{ label: string; quantity: number; amount: number }>,
  limit = 5,
): TopPerformerItem[] {
  const summary = new Map<string, { quantity: number; amount: number }>();

  for (const row of rows) {
    const current = summary.get(row.label) ?? { quantity: 0, amount: 0 };
    summary.set(row.label, {
      quantity: Number((current.quantity + row.quantity).toFixed(2)),
      amount: roundCurrency(current.amount + row.amount),
    });
  }

  return [...summary.entries()]
    .map(([label, value]) => ({
      label,
      quantity: value.quantity,
      amount: value.amount,
    }))
    .sort((left, right) => right.amount - left.amount || right.quantity - left.quantity || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function isReportPreset(value: string | undefined): value is ReportPreset {
  return (
    value === "today" ||
    value === "this-week" ||
    value === "this-month" ||
    value === "last-30-days" ||
    value === "custom"
  );
}

function isReportGroupBy(value: string | undefined): value is ReportGroupBy {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function getDefaultGroupByForCustomRange(from: DateTime, to: DateTime): ReportGroupBy {
  const days = Math.max(Math.ceil(to.diff(from, "days").days), 1);

  if (days <= 14) {
    return "daily";
  }

  if (days <= 90) {
    return "weekly";
  }

  return "monthly";
}

function parseBusinessDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = DateTime.fromISO(value, { zone: BUSINESS_TIMEZONE });
  return parsed.isValid ? parsed : null;
}

function formatDateLabel(value: DateTime) {
  return value.toFormat("LLL dd, yyyy");
}
