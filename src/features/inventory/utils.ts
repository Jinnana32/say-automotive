import type {
  InventoryMovementType,
  InventoryStockFilterState,
  InventoryStockItem,
  InventorySummary,
} from "@/features/inventory/types";

export function formatInventoryMovementType(type: InventoryMovementType) {
  return type.replaceAll("_", " ");
}

export function formatInventoryQuantity(value: number) {
  return value.toFixed(4).replace(/\.?0+$/, "");
}

export function buildInventorySummary(stocks: InventoryStockItem[]): InventorySummary {
  return {
    trackedProductCount: stocks.length,
    lowStockCount: stocks.filter((stock) => stock.isLowStock).length,
    outOfStockCount: stocks.filter((stock) => stock.isOutOfStock).length,
    totalOnHandQuantity: roundQuantity(
      stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0),
    ),
    totalStockValue: roundCurrency(
      stocks.reduce((sum, stock) => sum + stock.quantityOnHand * stock.costPrice, 0),
    ),
  };
}

export function filterInventoryStocks(
  stocks: InventoryStockItem[],
  filters: {
    search?: string;
    stockState?: InventoryStockFilterState;
  },
) {
  const stockState = filters.stockState ?? "all";
  const loweredSearch = filters.search?.trim().toLowerCase() ?? "";

  return stocks.filter((stock) => {
    const matchesState =
      stockState === "all"
        ? true
        : stockState === "low"
          ? stock.isLowStock
          : stockState === "out"
            ? stock.isOutOfStock
            : !stock.hasStockRecord;

    if (!matchesState) {
      return false;
    }

    if (!loweredSearch) {
      return true;
    }

    return [stock.productName, stock.sku ?? "", stock.barcode ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(loweredSearch);
  });
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}
