import type { TableRow } from "@/types/database";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildInventoryStockMap,
  buildUnitLabelMap,
  mapInventoryStockItemToProductOption,
  mapProductRowToInventoryStockItem,
  mapStockMovementRowToItem,
} from "@/features/inventory/mappers";
import type {
  InventoryDashboardData,
  InventoryMovementType,
  InventoryStockFilterState,
} from "@/features/inventory/types";
import { buildInventorySummary, filterInventoryStocks } from "@/features/inventory/utils";

type ProductRow = Pick<
  TableRow<"products">,
  | "id"
  | "name"
  | "sku"
  | "barcode"
  | "product_type"
  | "unit_id"
  | "cost_price"
  | "selling_price"
  | "reorder_level"
  | "shelf_location"
  | "branch_id"
>;
type UnitRow = Pick<TableRow<"units">, "id" | "name" | "abbreviation">;
type StockRow = Pick<
  TableRow<"inventory_stocks">,
  | "id"
  | "product_id"
  | "quantity_on_hand"
  | "reserved_quantity"
  | "available_quantity"
  | "reorder_level"
  | "shelf_location"
>;
type MovementRow = Pick<
  TableRow<"stock_movements">,
  | "id"
  | "product_id"
  | "movement_type"
  | "quantity"
  | "previous_quantity"
  | "new_quantity"
  | "reference_type"
  | "notes"
  | "created_at"
>;
type ProductMetaRow = Pick<TableRow<"products">, "id" | "name" | "sku" | "barcode">;

export async function getInventoryDashboardData(filters?: {
  search?: string;
  stockState?: InventoryStockFilterState;
  movementType?: InventoryMovementType | "";
}): Promise<InventoryDashboardData> {
  const branch = await getDefaultBranch();
  const { supabase } = await getAuthorizedSupabaseServerClient("inventory:read");
  let movementQuery = supabase
    .from("stock_movements")
    .select(
      "id, product_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, notes, created_at",
    )
    .eq("branch_id", branch.id)
    .order("created_at", { ascending: false })
    .limit(40);

  if (filters?.movementType) {
    movementQuery = movementQuery.eq("movement_type", filters.movementType);
  }

  const [
    { data: products, error: productsError },
    { data: units, error: unitsError },
    { data: stocks, error: stocksError },
    { data: movements, error: movementsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, product_type, unit_id, cost_price, selling_price, reorder_level, shelf_location, branch_id",
      )
      .eq("status", "active")
      .or(`branch_id.is.null,branch_id.eq.${branch.id}`)
      .order("name", { ascending: true }),
    supabase.from("units").select("id, name, abbreviation").order("name", { ascending: true }),
    supabase
      .from("inventory_stocks")
      .select(
        "id, product_id, quantity_on_hand, reserved_quantity, available_quantity, reorder_level, shelf_location",
      )
      .eq("branch_id", branch.id),
    movementQuery,
  ]);

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (unitsError) {
    throw new Error(unitsError.message);
  }

  if (stocksError) {
    throw new Error(stocksError.message);
  }

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const productRows = (products ?? []) as ProductRow[];
  const unitLabelMap = buildUnitLabelMap((units ?? []) as UnitRow[]);
  const stockMap = buildInventoryStockMap((stocks ?? []) as StockRow[]);
  const allStocks = productRows.map((row) =>
    mapProductRowToInventoryStockItem(row, {
      unitLabel: unitLabelMap.get(row.unit_id) ?? "Unknown unit",
      stockRow: stockMap.get(row.id) ?? null,
    }),
  );
  const filteredStocks = filterInventoryStocks(allStocks, {
    search: filters?.search,
    stockState: filters?.stockState,
  });
  const movementRows = (movements ?? []) as MovementRow[];
  const productMetaMap = await getProductMetaMap([
    ...new Set(movementRows.map((movement) => movement.product_id)),
  ]);
  const loweredSearch = filters?.search?.trim().toLowerCase() ?? "";
  const movementItems = movementRows
    .map((row) => {
      const productMeta = productMetaMap.get(row.product_id);

      return mapStockMovementRowToItem({
        row,
        productName: productMeta?.name ?? "Unknown product",
        sku: productMeta?.sku ?? null,
        barcode: productMeta?.barcode ?? null,
      });
    })
    .filter((movement) => {
      if (!loweredSearch) {
        return true;
      }

      return [movement.productName, movement.sku ?? "", movement.barcode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(loweredSearch);
    });

  return {
    branchName: branch.name,
    summary: buildInventorySummary(allStocks),
    stocks: filteredStocks,
    movements: movementItems,
    productOptions: allStocks.map(mapInventoryStockItemToProductOption),
  };
}

async function getProductMetaMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, ProductMetaRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, barcode")
    .in("id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as ProductMetaRow[]).map((row) => [row.id, row]));
}
