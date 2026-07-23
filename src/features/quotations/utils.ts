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
    jobOrderItemId: initial?.jobOrderItemId,
    quotationItemId: initial?.quotationItemId,
  };
}

export function calculateQuotationLineTotal(item: Pick<QuotationFormItem, "quantity" | "unitPrice">) {
  return roundCurrency(toNumeric(item.quantity) * toNumeric(item.unitPrice));
}

export function calculateQuotationSubtotal(items: QuotationFormItem[]) {
  return roundCurrency(items.reduce((sum, item) => sum + calculateQuotationLineTotal(item), 0));
}

export type QuotationDiscountMode = "fixed" | "percent";

export function calculateQuotationDiscountAmount(params: {
  subtotal: number;
  discount: string;
  discountMode: QuotationDiscountMode;
}) {
  const input = toNumeric(params.discount);

  if (params.discountMode === "percent") {
    return roundCurrency(params.subtotal * (input / 100));
  }

  return roundCurrency(input);
}

export function calculateQuotationTaxAmount(params: {
  subtotal: number;
  discountAmount: number;
  taxRate: string;
}) {
  const taxableAmount = Math.max(params.subtotal - params.discountAmount, 0);
  return roundCurrency(taxableAmount * (toNumeric(params.taxRate) / 100));
}

export function calculateQuotationTotals(params: {
  items: QuotationFormItem[];
  discount: string;
  discountMode: QuotationDiscountMode;
  taxRate: string;
}) {
  const subtotal = calculateQuotationSubtotal(params.items);
  const discountAmount = calculateQuotationDiscountAmount({
    subtotal,
    discount: params.discount,
    discountMode: params.discountMode,
  });
  const taxAmount = calculateQuotationTaxAmount({
    subtotal,
    discountAmount,
    taxRate: params.taxRate,
  });
  const grandTotal = roundCurrency(Math.max(subtotal - discountAmount, 0) + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
  };
}

export function calculateQuotationGrandTotal(params: {
  items: QuotationFormItem[];
  discount: string;
  tax: string;
}) {
  const subtotal = calculateQuotationSubtotal(params.items);
  const discountAmount = toNumeric(params.discount);
  const taxAmount = toNumeric(params.tax);
  return roundCurrency(Math.max(subtotal - discountAmount, 0) + taxAmount);
}

export function inferQuotationTaxRate(params: {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  defaultTaxRate: number;
}) {
  const taxableAmount = Math.max(params.subtotal - params.discountAmount, 0);

  if (taxableAmount > 0 && params.taxAmount > 0) {
    return roundCurrency((params.taxAmount / taxableAmount) * 100);
  }

  return params.defaultTaxRate;
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

export function mergeQuotationPartiesIntoFormOptions(
  options: {
    customers: CustomerOption[];
    vehicles: QuotationVehicleOption[];
  },
  parties: {
    customerId: string;
    customerName: string;
    vehicleId: string;
    vehicleLabel: string;
  },
) {
  const customers = dedupeOptionsById([
    ...options.customers,
    {
      id: parties.customerId,
      label: parties.customerName,
    },
  ]);
  const vehicles = dedupeOptionsById([
    ...options.vehicles,
    {
      id: parties.vehicleId,
      customerId: parties.customerId,
      label: parties.vehicleLabel,
    },
  ]);

  return {
    customers,
    vehicles,
  };
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

const REVISE_LOCKED_JOB_ORDER_STATUSES = new Set([
  "completed",
  "ready_for_billing",
  "paid",
  "released",
  "cancelled",
]);

export function canReviseQuotation(params: {
  status: QuotationStatus;
  jobOrderId: string | null;
  jobOrderStatus?: string | null;
  hasActiveInvoice?: boolean;
}) {
  if (params.status !== "approved" || !params.jobOrderId) {
    return false;
  }

  if (params.hasActiveInvoice) {
    return false;
  }

  if (!params.jobOrderStatus) {
    return true;
  }

  return !REVISE_LOCKED_JOB_ORDER_STATUSES.has(params.jobOrderStatus);
}
