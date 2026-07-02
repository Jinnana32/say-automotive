import { formatMoneyInputValue } from "@/lib/currency";

import type { HistoricalServiceFormItem } from "@/features/historical-service/types";

export function createHistoricalServiceItem(
  initial?: Partial<HistoricalServiceFormItem>,
): HistoricalServiceFormItem {
  return {
    key: initial?.key ?? `historical-item-${Math.random().toString(36).slice(2, 11)}`,
    itemType: initial?.itemType ?? "labor",
    description: initial?.description ?? "",
    quantity: initial?.quantity ?? "1",
    unitPrice: initial?.unitPrice ?? formatMoneyInputValue(0),
  };
}

export function toOptionalNumeric(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
