import { cache } from "react";

import {
  applyCatalogVisibilityFilter,
  canManageCatalogRecord,
  getCatalogSharingSettings,
  resolveCatalogPermissions,
} from "@/lib/catalog-visibility";
import { getBranchScopedServerClient } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { mapServiceRowToListItem } from "@/features/services/mappers";
import type { ServiceFormOptionsData, ServiceListItem } from "@/features/services/types";
import type { TableRow } from "@/types/database";

type ServiceRow = TableRow<"services">;
type BranchRow = Pick<TableRow<"branches">, "id" | "name">;

export async function listServices(search?: string): Promise<ServiceListItem[]> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("services:read");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  let query = applyCatalogVisibilityFilter(
    supabase.from("services").select("*").order("name", { ascending: true }),
    {
      branchId: branchScope.selectedBranchId,
      includeGlobal: sharingSettings.allowGlobalServiceCatalog,
    },
  );

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(`name.ilike.%${escapedSearch}%,category.ilike.%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const branchNameMap = await getBranchNameMap(
    [...new Set(((data ?? []) as ServiceRow[]).map((row) => row.branch_id))],
  );

  return ((data ?? []) as ServiceRow[]).map((row) =>
    mapServiceRowToListItem(row, {
      owningBranchName: branchNameMap.get(row.branch_id) ?? null,
      canManage: canManageCatalogRecord({
        ownerBranchId: row.branch_id,
        writeBranchId: branchScope.writeBranchId,
        canAccessAllBranches: branchScope.canAccessAllBranches,
      }),
    }),
  );
}

export const getServiceById = cache(async (serviceId: string) => {
  const { branchScope, supabase } = await getBranchScopedServerClient("services:read");
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  const { data, error } = await applyCatalogVisibilityFilter(
    supabase.from("services").select("*"),
    {
      branchId: branchScope.selectedBranchId,
      includeGlobal: sharingSettings.allowGlobalServiceCatalog,
    },
  )
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ServiceRow | null) ?? null;
});

export const getEditableServiceById = cache(async (serviceId: string) => {
  const { branchScope, supabase } = await getBranchScopedServerClient("services:write");
  let query = supabase.from("services").select("*");

  if (!branchScope.canAccessAllBranches) {
    query = query.eq("branch_id", branchScope.writeBranchId);
  }

  const { data, error } = await query.eq("id", serviceId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ServiceRow | null) ?? null;
});

export async function getServiceFormOptions(): Promise<ServiceFormOptionsData> {
  const { branchScope, context } = await getBranchScopedServerClient("services:write");
  const permissions = resolveCatalogPermissions({
    role: context.role,
    accessibleBranchCount: branchScope.accessibleBranches.length,
    capabilities: context.capabilities,
  });

  return {
    branches: branchScope.accessibleBranches.map((branch) => ({
      id: branch.id,
      label: branch.name,
    })),
    permissions,
    defaultBranchId: branchScope.selectedBranchId ?? branchScope.writeBranchId,
  };
}

async function getBranchNameMap(branchIds: string[]) {
  if (branchIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("branches").select("id, name").in("id", branchIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as BranchRow[]).map((row) => [row.id, row.name]));
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
