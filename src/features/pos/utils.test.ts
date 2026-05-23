import { describe, expect, it } from "vitest";

import {
  addProductToCart,
  calculatePosSubtotal,
  calculatePosTax,
  calculatePosTotal,
  setCartItemQuantity,
} from "@/features/pos/utils";

const product = {
  id: "product-1",
  name: "Engine oil",
  sku: "OIL-001",
  barcode: "123456",
  imageUrl: null,
  unitLabel: "Bottle (btl)",
  sellingPrice: 550,
  availableQuantity: 3,
  hasStockRecord: true,
  reorderLevel: 2,
  shelfLocation: "A-02",
  isLowStock: false,
} as const;

describe("pos utils", () => {
  it("adds products to the cart and caps quantity to available stock", () => {
    const once = addProductToCart([], product);
    const twice = addProductToCart(once, product);
    const fourTimes = addProductToCart(
      addProductToCart(addProductToCart(twice, product), product),
      product,
    );

    expect(once).toHaveLength(1);
    expect(twice[0]?.quantity).toBe(2);
    expect(fourTimes[0]?.quantity).toBe(3);
  });

  it("recalculates subtotal, tax, and total", () => {
    const items = [
      { quantity: 2, unitPrice: 550 },
      { quantity: 1, unitPrice: 1250 },
    ];

    const subtotal = calculatePosSubtotal(items);
    const tax = calculatePosTax({ subtotal, discount: 100, taxRate: 12 });
    const total = calculatePosTotal({ subtotal, discount: 100, tax });

    expect(subtotal).toBe(2350);
    expect(tax).toBe(270);
    expect(total).toBe(2520);
  });

  it("clamps manual quantities to the available stock", () => {
    const cart = addProductToCart([], product);
    const updated = setCartItemQuantity(cart, product.id, 10);

    expect(updated[0]?.quantity).toBe(3);
  });
});
