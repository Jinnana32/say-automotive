import type { QuotationFormItem } from "@/features/quotations/types";

export function createQuotationItem(
  initial?: Partial<QuotationFormItem>,
): QuotationFormItem {
  return {
    key: initial?.key ?? `quotation-item-${Math.random().toString(36).slice(2, 11)}`,
    itemType: initial?.itemType ?? "product",
    productId: initial?.productId ?? "",
    serviceId: initial?.serviceId ?? "",
    description: initial?.description ?? "",
    quantity: initial?.quantity ?? "1",
    unitPrice: initial?.unitPrice ?? "0",
  };
}

export function calculateQuotationLineTotal(item: Pick<QuotationFormItem, "quantity" | "unitPrice">) {
  return roundCurrency(toNumeric(item.quantity) * toNumeric(item.unitPrice));
}

export function calculateQuotationSubtotal(items: QuotationFormItem[]) {
  return roundCurrency(items.reduce((sum, item) => sum + calculateQuotationLineTotal(item), 0));
}

export function calculateQuotationGrandTotal(params: {
  items: QuotationFormItem[];
  discount: string;
  tax: string;
}) {
  const subtotal = calculateQuotationSubtotal(params.items);
  return roundCurrency(subtotal - toNumeric(params.discount) + toNumeric(params.tax));
}

export function toNumeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
