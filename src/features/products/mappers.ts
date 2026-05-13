import type { TableRow } from "@/types/database";

import { formatMoneyInputValue } from "@/lib/currency";
import type { ProductFormValues, ProductListItem, ReferenceOption } from "@/features/products/types";

type ProductRow = TableRow<"products">;
type CategoryRow = TableRow<"product_categories">;
type BrandRow = TableRow<"brands">;
type UnitRow = TableRow<"units">;
type SupplierRow = TableRow<"suppliers">;

export function mapProductRowToListItem(
  row: ProductRow,
  dictionaries: {
    categories: Map<string, string>;
    brands: Map<string, string>;
    units: Map<string, string>;
    suppliers: Map<string, string>;
  },
): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    productType: row.product_type,
    categoryName: row.category_id ? dictionaries.categories.get(row.category_id) ?? null : null,
    brandName: row.brand_id ? dictionaries.brands.get(row.brand_id) ?? null : null,
    unitLabel: dictionaries.units.get(row.unit_id) ?? "Unknown unit",
    supplierName: row.primary_supplier_id
      ? dictionaries.suppliers.get(row.primary_supplier_id) ?? null
      : null,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    reorderLevel: row.reorder_level,
    websiteVisible: row.website_visible,
    websiteFeatured: row.website_featured,
    websiteSortOrder: row.website_sort_order,
    websiteSlug: row.website_slug,
    websiteImageUrl: row.website_image_url,
    websiteShortDescription: row.website_short_description,
    websiteBadge: row.website_badge,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductRowToFormValues(row: ProductRow): ProductFormValues {
  return {
    productId: row.id,
    name: row.name,
    sku: row.sku ?? "",
    barcode: row.barcode ?? "",
    categoryId: row.category_id ?? "",
    brandId: row.brand_id ?? "",
    supplierId: row.primary_supplier_id ?? "",
    unitId: row.unit_id,
    partNumber: row.part_number ?? "",
    oemNumber: row.oem_number ?? "",
    description: row.description ?? "",
    productType: row.product_type,
    costPrice: formatMoneyInputValue(row.cost_price),
    sellingPrice: formatMoneyInputValue(row.selling_price),
    reorderLevel: String(row.reorder_level),
    warrantyDurationDays: row.warranty_duration_days ? String(row.warranty_duration_days) : "",
    shelfLocation: row.shelf_location ?? "",
    websiteVisible: row.website_visible,
    websiteFeatured: row.website_featured,
    websiteSortOrder: String(row.website_sort_order),
    websiteSlug: row.website_slug ?? "",
    websiteImageUrl: row.website_image_url ?? "",
    websiteShortDescription: row.website_short_description ?? "",
    websiteBadge: row.website_badge ?? "",
    status: row.status,
  };
}

export function mapReferenceRowsToOptions<T extends { id: string; name?: string; abbreviation?: string; supplier_name?: string }>(
  rows: T[],
  labelSelector: (row: T) => string,
): ReferenceOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: labelSelector(row),
  }));
}

export function buildCategoryMap(rows: CategoryRow[]) {
  return new Map(rows.map((row) => [row.id, row.name]));
}

export function buildBrandMap(rows: BrandRow[]) {
  return new Map(rows.map((row) => [row.id, row.name]));
}

export function buildUnitMap(rows: UnitRow[]) {
  return new Map(rows.map((row) => [row.id, `${row.name} (${row.abbreviation})`]));
}

export function buildSupplierMap(rows: SupplierRow[]) {
  return new Map(rows.map((row) => [row.id, row.supplier_name]));
}
