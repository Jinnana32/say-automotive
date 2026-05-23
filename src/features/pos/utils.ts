import type { PosCartItem, PosProductOption, PosSerializedItem } from "@/features/pos/types";
import { roundCurrency } from "@/lib/currency";

export function createPosCartItem(product: PosProductOption): PosCartItem {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    unitLabel: product.unitLabel,
    unitPrice: product.sellingPrice,
    availableQuantity: product.availableQuantity,
    quantity: 1,
    shelfLocation: product.shelfLocation,
    hasStockRecord: product.hasStockRecord,
    isLowStock: product.isLowStock,
  };
}

export function addProductToCart(items: PosCartItem[], product: PosProductOption) {
  const existing = items.find((item) => item.productId === product.id);

  if (!existing) {
    return product.availableQuantity > 0 ? [...items, createPosCartItem(product)] : items;
  }

  return items.map((item) =>
    item.productId === product.id
      ? {
          ...item,
          availableQuantity: product.availableQuantity,
          unitPrice: product.sellingPrice,
          quantity: clampQuantity(item.quantity + 1, product.availableQuantity),
          shelfLocation: product.shelfLocation,
          hasStockRecord: product.hasStockRecord,
          isLowStock: product.isLowStock,
        }
      : item,
  );
}

export function setCartItemQuantity(items: PosCartItem[], productId: string, quantity: number) {
  return items.map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: clampQuantity(quantity, item.availableQuantity),
        }
      : item,
  );
}

export function removeCartItem(items: PosCartItem[], productId: string) {
  return items.filter((item) => item.productId !== productId);
}

export function calculatePosSubtotal(items: Pick<PosCartItem, "quantity" | "unitPrice">[]) {
  return roundCurrency(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
}

export function calculatePosTax(params: {
  subtotal: number;
  discount: number;
  taxRate: number;
}) {
  const taxableAmount = Math.max(params.subtotal - params.discount, 0);
  return roundCurrency(taxableAmount * (params.taxRate / 100));
}

export function calculatePosTotal(params: {
  subtotal: number;
  discount: number;
  tax: number;
}) {
  return roundCurrency(Math.max(params.subtotal - params.discount, 0) + params.tax);
}

export function serializePosItems(items: PosCartItem[]) {
  const serialized: PosSerializedItem[] = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  return JSON.stringify(serialized);
}

export function toNumericInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampQuantity(quantity: number, availableQuantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1;
  }

  if (availableQuantity <= 0) {
    return 1;
  }

  return Math.min(Number(quantity.toFixed(4)), availableQuantity);
}
