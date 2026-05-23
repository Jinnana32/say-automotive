import { cache } from "react";

import {
  applyCatalogVisibilityFilter,
  canManageCatalogRecord,
  getCatalogSharingSettings,
  resolveCatalogPermissions,
} from "@/lib/catalog-visibility";
import { getBranchScopedServerClient } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildBrandMap,
  buildBranchMap,
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
type BranchRow = Pick<TableRow<"branches">, "id" | "name">;

export async function listProducts(search?: string): Promise<ProductListItem[]> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("products:read");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  let query = applyCatalogVisibilityFilter(
    supabase.from("products").select("*").order("name", { ascending: true }),
    {
      branchId: branchScope.selectedBranchId,
      includeGlobal: sharingSettings.allowGlobalProductCatalog,
    },
  );

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
    branches: buildBranchMap(references.branches),
    units: buildUnitMap(references.units),
    suppliers: buildSupplierMap(references.suppliers),
  };

  return ((products ?? []) as ProductRow[]).map((row) =>
    mapProductRowToListItem(row, dictionaries, {
      canManage: canManageCatalogRecord({
        ownerBranchId: row.branch_id,
        writeBranchId: branchScope.writeBranchId,
        canAccessAllBranches: branchScope.canAccessAllBranches,
      }),
    }),
  );
}

export const getProductById = cache(async (productId: string) => {
  const { branchScope, supabase } = await getBranchScopedServerClient("products:read");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  const { data, error } = await applyCatalogVisibilityFilter(
    supabase.from("products").select("*"),
    {
      branchId: branchScope.selectedBranchId,
      includeGlobal: sharingSettings.allowGlobalProductCatalog,
    },
  )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProductRow | null) ?? null;
});

export const getEditableProductById = cache(async (productId: string) => {
  const { branchScope, supabase } = await getBranchScopedServerClient("products:write");
  let query = supabase.from("products").select("*");

  if (!branchScope.canAccessAllBranches) {
    query = query.eq("branch_id", branchScope.writeBranchId);
  }

  const { data, error } = await query.eq("id", productId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProductRow | null) ?? null;
});

export async function getProductFormOptions(): Promise<ProductFormOptionsData> {
  const { branchScope, context } = await getBranchScopedServerClient("products:write");
  const references = await getProductReferenceRows();
  const permissions = resolveCatalogPermissions({
    role: context.role,
    accessibleBranchCount: branchScope.accessibleBranches.length,
    capabilities: context.capabilities,
  });

  return {
    categories: mapReferenceRowsToOptions(references.categories, (row) => row.name),
    brands: mapReferenceRowsToOptions(references.brands, (row) => row.name),
    suppliers: mapReferenceRowsToOptions(references.suppliers, (row) => row.supplier_name),
    units: mapReferenceRowsToOptions(
      references.units,
      (row) => `${row.name} (${row.abbreviation})`,
    ),
    branches: branchScope.accessibleBranches.map((branch) => ({
      id: branch.id,
      label: branch.name,
    })),
    permissions,
    defaultBranchId: branchScope.selectedBranchId ?? branchScope.writeBranchId,
  };
}

const getProductReferenceRows = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const [
    { data: categories, error: categoryError },
    { data: brands, error: brandError },
    { data: branches, error: branchError },
    { data: suppliers, error: supplierError },
    { data: units, error: unitError },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").eq("status", "active").order("name", { ascending: true }),
    supabase.from("brands").select("*").eq("status", "active").order("name", { ascending: true }),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name", { ascending: true }),
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

  if (branchError) {
    throw new Error(branchError.message);
  }

  if (unitError) {
    throw new Error(unitError.message);
  }

  return {
    categories: (categories ?? []) as CategoryRow[],
    brands: (brands ?? []) as BrandRow[],
    branches: (branches ?? []) as BranchRow[],
    suppliers: (suppliers ?? []) as SupplierRow[],
    units: (units ?? []) as UnitRow[],
  };
});

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
