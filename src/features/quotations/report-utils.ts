import type { QuotationDetail, QuotationItemDetail } from "@/features/quotations/types";
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
  partLines: QuotationPartPrintLine[];
  laborLines: QuotationLaborPrintLine[];
  subtotal: number;
  totalParts: number;
  totalLabor: number;
  discount: number;
  tax: number;
  grandTotal: number;
};

export function buildQuotationPrintBreakdown(
  quotation: Pick<QuotationDetail, "items" | "discount" | "tax" | "totalAmount">,
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

  return {
    partLines,
    laborLines,
    subtotal: roundCurrency(
      partLines.reduce((sum, item) => sum + item.total, 0) +
        laborLines.reduce((sum, item) => sum + item.total, 0),
    ),
    totalParts: roundCurrency(partLines.reduce((sum, item) => sum + item.total, 0)),
    totalLabor: roundCurrency(laborLines.reduce((sum, item) => sum + item.total, 0)),
    discount: quotation.discount,
    tax: quotation.tax,
    grandTotal: quotation.totalAmount,
  };
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
