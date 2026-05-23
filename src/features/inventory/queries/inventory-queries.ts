import type { TableRow } from "@/types/database";

import {
  getBranchScopedServerClient,
} from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
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
  const { branchScope, context, supabase } = await getBranchScopedServerClient("inventory:read");
  const branchId = branchScope.selectedBranchId;
  const sharingSettings = await getCatalogSharingSettings(supabase, branchId);
  let movementQuery = supabase
    .from("stock_movements")
    .select(
      "id, product_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (branchId) {
    movementQuery = movementQuery.eq("branch_id", branchId);
  }

  if (filters?.movementType) {
    movementQuery = movementQuery.eq("movement_type", filters.movementType);
  }

  const [
    { data: products, error: productsError },
    { data: units, error: unitsError },
    { data: stocks, error: stocksError },
    { data: movements, error: movementsError },
  ] = await Promise.all([
    applyCatalogVisibilityFilter(
      supabase
        .from("products")
        .select(
          "id, name, sku, barcode, product_type, unit_id, cost_price, selling_price, reorder_level, shelf_location, branch_id",
        )
        .eq("status", "active")
        .order("name", { ascending: true }),
      {
        branchId,
        includeGlobal: sharingSettings.allowGlobalProductCatalog,
      },
    ),
    supabase.from("units").select("id, name, abbreviation").order("name", { ascending: true }),
    (() => {
      let query = supabase
        .from("inventory_stocks")
        .select(
          "id, product_id, quantity_on_hand, reserved_quantity, available_quantity, reorder_level, shelf_location",
        );

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      return query;
    })(),
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
  const stockMap = buildInventoryStockMap(aggregateStockRows((stocks ?? []) as StockRow[]));
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
    branchName: branchScope.selectedBranch?.name ?? branchScope.selectedBranchLabel,
    summary: buildInventorySummary(allStocks),
    stocks: filteredStocks,
    movements: movementItems,
    productOptions: allStocks.map(mapInventoryStockItemToProductOption),
    permissions: {
      canCreateProducts: context.capabilities.includes("products:write"),
    },
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

function aggregateStockRows(rows: StockRow[]) {
  const grouped = new Map<string, StockRow>();

  for (const row of rows) {
    const existing = grouped.get(row.product_id);

    if (!existing) {
      grouped.set(row.product_id, { ...row });
      continue;
    }

    grouped.set(row.product_id, {
      ...existing,
      id: existing.id,
      quantity_on_hand: existing.quantity_on_hand + row.quantity_on_hand,
      reserved_quantity: existing.reserved_quantity + row.reserved_quantity,
      available_quantity: existing.available_quantity + row.available_quantity,
      reorder_level: existing.reorder_level ?? row.reorder_level,
      shelf_location: existing.shelf_location ?? row.shelf_location,
    });
  }

  return [...grouped.values()];
}
