import type { CustomerOption } from "@/features/customers/types";
import type { QuotationFormItem, QuotationStatus, QuotationVehicleOption } from "@/features/quotations/types";
import { formatMoneyInputValue, roundCurrency } from "@/lib/currency";

type OptionWithId = {
  id: string;
};

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
    unitPrice: initial?.unitPrice ?? formatMoneyInputValue(0),
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

export function dedupeOptionsById<T extends OptionWithId>(options: T[]) {
  const optionsById = new Map<string, T>();

  for (const option of options) {
    optionsById.set(option.id, option);
  }

  return Array.from(optionsById.values());
}

export function resolveQuotationCreateFlowSelection(params: {
  requestedCustomerId?: string;
  requestedVehicleId?: string;
  customers: CustomerOption[];
  vehicles: QuotationVehicleOption[];
}) {
  const matchedVehicle = params.requestedVehicleId
    ? params.vehicles.find((vehicle) => vehicle.id === params.requestedVehicleId) ?? null
    : null;

  if (matchedVehicle) {
    return {
      customerId: matchedVehicle.customerId,
      vehicleId: matchedVehicle.id,
    };
  }

  const hasRequestedCustomer = params.requestedCustomerId
    ? params.customers.some((customer) => customer.id === params.requestedCustomerId)
    : false;

  return {
    customerId: hasRequestedCustomer ? params.requestedCustomerId ?? "" : "",
    vehicleId: "",
  };
}

export function canDeleteQuotation(status: QuotationStatus) {
  return status !== "approved";
}
