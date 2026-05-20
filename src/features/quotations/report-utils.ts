import type {
  QuotationDetail,
  QuotationItemDetail,
  QuotationPrintMode,
} from "@/features/quotations/types";
import { roundCurrency } from "@/lib/currency";

export type QuotationPartPrintLine = {
  id: string;
  description: string;
  quantityLabel: string;
  unitPrice: number;
  total: number;
};

export type QuotationLaborPrintLine = {
  id: string;
  description: string;
  total: number;
};

export type QuotationPrintBreakdown = {
  mode: QuotationPrintMode;
  partLines: QuotationPartPrintLine[];
  laborLines: QuotationLaborPrintLine[];
  subtotal: number;
  totalParts: number;
  totalLabor: number;
  discount: number;
  tax: number;
  grandTotal: number;
  visibleSubtotal: number;
  visibleTotal: number;
};

export function buildQuotationPrintBreakdown(
  quotation: Pick<QuotationDetail, "items" | "discount" | "tax" | "totalAmount">,
  mode: QuotationPrintMode = "full",
): QuotationPrintBreakdown {
  const partLines = quotation.items
    .filter((item) => item.itemType === "product")
    .map((item) => ({
      id: item.id,
      description: item.description,
      quantityLabel: formatPartQuantity(item),
      unitPrice: item.unitPrice,
      total: item.total,
    }));
  const laborLines = quotation.items
    .filter((item) => item.itemType === "service" || item.itemType === "labor")
    .map((item) => ({
      id: item.id,
      description: formatLaborDescription(item),
      total: item.total,
    }));

  const totalParts = roundCurrency(partLines.reduce((sum, item) => sum + item.total, 0));
  const totalLabor = roundCurrency(laborLines.reduce((sum, item) => sum + item.total, 0));
  const subtotal = roundCurrency(totalParts + totalLabor);
  const visibleSubtotal =
    mode === "parts" ? totalParts : mode === "labor" ? totalLabor : subtotal;

  return {
    mode,
    partLines,
    laborLines,
    subtotal,
    totalParts,
    totalLabor,
    discount: quotation.discount,
    tax: quotation.tax,
    grandTotal: quotation.totalAmount,
    visibleSubtotal,
    visibleTotal: mode === "full" ? quotation.totalAmount : visibleSubtotal,
  };
}

export function resolveQuotationPrintMode(
  value: string | null | undefined,
): QuotationPrintMode {
  return value === "parts" || value === "labor" ? value : "full";
}

function formatPartQuantity(item: QuotationItemDetail) {
  return item.unitLabel ? `${trimNumeric(item.quantity)} ${item.unitLabel}` : trimNumeric(item.quantity);
}

function formatLaborDescription(item: QuotationItemDetail) {
  if (item.quantity === 1) {
    return item.description;
  }

  return `${item.description} (x${trimNumeric(item.quantity)})`;
}

function trimNumeric(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}
