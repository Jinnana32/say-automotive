import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildBrandMap,
  buildCategoryMap,
  buildSupplierMap,
  buildUnitMap,
  mapProductRowToListItem,
  mapReferenceRowsToOptions,
} from "@/features/products/mappers";
import type {
  ProductFormOptionsData,
  ProductListItem,
  ReferenceOption,
} from "@/features/products/types";
import type { TableRow } from "@/types/database";

type ProductRow = TableRow<"products">;
type CategoryRow = TableRow<"product_categories">;
type BrandRow = TableRow<"brands">;
type SupplierRow = TableRow<"suppliers">;
type UnitRow = TableRow<"units">;

export async function listProducts(search?: string): Promise<ProductListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("products:read");
  let query = supabase.from("products").select("*").order("name", { ascending: true });

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `name.ilike.%${escapedSearch}%,sku.ilike.%${escapedSearch}%,barcode.ilike.%${escapedSearch}%,part_number.ilike.%${escapedSearch}%`,
    );
  }

  const [{ data: products, error: productError }, references] = await Promise.all([
    query,
    getProductReferenceRows(),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  const dictionaries = {
    categories: buildCategoryMap(references.categories),
    brands: buildBrandMap(references.brands),
    units: buildUnitMap(references.units),
    suppliers: buildSupplierMap(references.suppliers),
  };

  return ((products ?? []) as ProductRow[]).map((row) => mapProductRowToListItem(row, dictionaries));
}

export const getProductById = cache(async (productId: string) => {
  const { supabase } = await getAuthorizedSupabaseServerClient("products:read");
  const { data, error } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProductRow | null) ?? null;
});

export async function getProductFormOptions(): Promise<ProductFormOptionsData> {
  await getAuthorizedSupabaseServerClient("products:write");
  const references = await getProductReferenceRows();

  return {
    categories: mapReferenceRowsToOptions(references.categories, (row) => row.name),
    brands: mapReferenceRowsToOptions(references.brands, (row) => row.name),
    suppliers: mapReferenceRowsToOptions(references.suppliers, (row) => row.supplier_name),
    units: mapReferenceRowsToOptions(
      references.units,
      (row) => `${row.name} (${row.abbreviation})`,
    ),
  };
}

const getProductReferenceRows = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const [
    { data: categories, error: categoryError },
    { data: brands, error: brandError },
    { data: suppliers, error: supplierError },
    { data: units, error: unitError },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").eq("status", "active").order("name", { ascending: true }),
    supabase.from("brands").select("*").eq("status", "active").order("name", { ascending: true }),
    supabase.from("suppliers").select("*").eq("status", "active").order("supplier_name", { ascending: true }),
    supabase.from("units").select("*").order("name", { ascending: true }),
  ]);

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  if (brandError) {
    throw new Error(brandError.message);
  }

  if (supplierError) {
    throw new Error(supplierError.message);
  }

  if (unitError) {
    throw new Error(unitError.message);
  }

  return {
    categories: (categories ?? []) as CategoryRow[],
    brands: (brands ?? []) as BrandRow[],
    suppliers: (suppliers ?? []) as SupplierRow[],
    units: (units ?? []) as UnitRow[],
  };
});

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
