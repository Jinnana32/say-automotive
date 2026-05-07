import type { TableRow } from "@/types/database";

import type {
  InventoryMovementItem,
  InventoryProductOption,
  InventoryStockItem,
} from "@/features/inventory/types";

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
>;
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
type UnitRow = Pick<TableRow<"units">, "id" | "name" | "abbreviation">;

export function mapProductRowToInventoryStockItem(
  row: ProductRow,
  params: {
    unitLabel: string;
    stockRow: StockRow | null;
  },
): InventoryStockItem {
  const quantityOnHand = params.stockRow?.quantity_on_hand ?? 0;
  const reservedQuantity = params.stockRow?.reserved_quantity ?? 0;
  const availableQuantity = params.stockRow?.available_quantity ?? 0;
  const reorderLevel = params.stockRow?.reorder_level ?? row.reorder_level ?? null;
  const hasStockRecord = params.stockRow !== null;
  const isOutOfStock = availableQuantity <= 0;
  const isLowStock =
    reorderLevel !== null ? availableQuantity <= reorderLevel : isOutOfStock;

  return {
    stockId: params.stockRow?.id ?? null,
    productId: row.id,
    productName: row.name,
    sku: row.sku,
    barcode: row.barcode,
    productType: row.product_type,
    unitLabel: params.unitLabel,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    quantityOnHand,
    reservedQuantity,
    availableQuantity,
    reorderLevel,
    shelfLocation: params.stockRow?.shelf_location ?? row.shelf_location ?? null,
    hasStockRecord,
    isLowStock,
    isOutOfStock,
  };
}

export function mapInventoryStockItemToProductOption(
  item: InventoryStockItem,
): InventoryProductOption {
  return {
    id: item.productId,
    label: item.productName,
    sku: item.sku,
    quantityOnHand: item.quantityOnHand,
    availableQuantity: item.availableQuantity,
    reorderLevel: item.reorderLevel,
    shelfLocation: item.shelfLocation,
    hasStockRecord: item.hasStockRecord,
  };
}

export function mapStockMovementRowToItem(params: {
  row: MovementRow;
  productName: string;
  sku: string | null;
  barcode: string | null;
}): InventoryMovementItem {
  return {
    id: params.row.id,
    productId: params.row.product_id,
    productName: params.productName,
    sku: params.sku,
    barcode: params.barcode,
    movementType: params.row.movement_type,
    quantity: params.row.quantity,
    previousQuantity: params.row.previous_quantity,
    newQuantity: params.row.new_quantity,
    referenceType: params.row.reference_type,
    notes: params.row.notes,
    createdAt: params.row.created_at,
  };
}

export function buildInventoryStockMap(rows: StockRow[]) {
  return new Map(rows.map((row) => [row.product_id, row]));
}

export function buildUnitLabelMap(rows: UnitRow[]) {
  return new Map(rows.map((row) => [row.id, `${row.name} (${row.abbreviation})`]));
}
