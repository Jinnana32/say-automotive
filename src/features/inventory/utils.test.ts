import { describe, expect, it } from "vitest";

import {
  buildInventorySummary,
  filterInventoryStocks,
  formatInventoryMovementType,
  formatInventoryQuantity,
} from "@/features/inventory/utils";

const stocks = [
  {
    stockId: "stock-1",
    productId: "product-1",
    productName: "Brake pads",
    sku: "BRK-001",
    barcode: "111",
    productType: "part" as const,
    unitLabel: "Set (set)",
    costPrice: 1200,
    sellingPrice: 1800,
    quantityOnHand: 4,
    reservedQuantity: 1,
    availableQuantity: 3,
    reorderLevel: 3,
    shelfLocation: "A-01",
    hasStockRecord: true,
    isLowStock: true,
    isOutOfStock: false,
  },
  {
    stockId: null,
    productId: "product-2",
    productName: "Engine oil",
    sku: "OIL-001",
    barcode: "222",
    productType: "fluid" as const,
    unitLabel: "Bottle (btl)",
    costPrice: 250,
    sellingPrice: 450,
    quantityOnHand: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    reorderLevel: 2,
    shelfLocation: null,
    hasStockRecord: false,
    isLowStock: true,
    isOutOfStock: true,
  },
];

describe("inventory utils", () => {
  it("builds inventory summary totals", () => {
    const summary = buildInventorySummary(stocks);

    expect(summary.trackedProductCount).toBe(2);
    expect(summary.lowStockCount).toBe(2);
    expect(summary.outOfStockCount).toBe(1);
    expect(summary.totalOnHandQuantity).toBe(4);
    expect(summary.totalStockValue).toBe(4800);
  });

  it("filters inventory stocks by state and search", () => {
    expect(filterInventoryStocks(stocks, { stockState: "missing" })).toHaveLength(1);
    expect(filterInventoryStocks(stocks, { stockState: "out" })).toHaveLength(1);
    expect(filterInventoryStocks(stocks, { search: "brake" })).toHaveLength(1);
  });

  it("formats movement labels and quantities", () => {
    expect(formatInventoryMovementType("service_usage")).toBe("service usage");
    expect(formatInventoryQuantity(2)).toBe("2");
    expect(formatInventoryQuantity(2.5)).toBe("2.5");
  });
});
