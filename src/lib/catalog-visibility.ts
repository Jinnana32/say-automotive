import type { AppCapability, StaffRole } from "@/lib/auth/permissions";

type QueryWithBranchEqAndOr<T> = {
  eq: (column: string, value: string) => T;
  or: (filters: string) => T;
};

export type CatalogKind = "product" | "service";

export type CatalogSharingSettings = {
  allowGlobalProductCatalog: boolean;
  allowGlobalServiceCatalog: boolean;
};

export type CatalogBranchOption = {
  id: string;
  label: string;
};

export function isGlobalCatalogSharingEnabled(
  settings: CatalogSharingSettings,
  kind: CatalogKind,
) {
  return kind === "product"
    ? settings.allowGlobalProductCatalog
    : settings.allowGlobalServiceCatalog;
}

export function applyCatalogVisibilityFilter<T>(
  query: QueryWithBranchEqAndOr<T>,
  params: {
    branchId: string | null;
    includeGlobal: boolean;
    branchColumn?: string;
    globalColumn?: string;
  },
) {
  const {
    branchId,
    includeGlobal,
    branchColumn = "branch_id",
    globalColumn = "is_global",
  } = params;

  if (!branchId) {
    return query as T;
  }

  if (!includeGlobal) {
    return query.eq(branchColumn, branchId);
  }

  return query.or(`${branchColumn}.eq.${branchId},${globalColumn}.eq.true`);
}

export function canManageCatalogRecord(params: {
  ownerBranchId: string;
  writeBranchId: string;
  canAccessAllBranches: boolean;
}) {
  return params.canAccessAllBranches || params.ownerBranchId === params.writeBranchId;
}

export function canMarkCatalogRecordGlobal(role: StaffRole) {
  return role === "owner" || role === "admin";
}

export function canSelectCatalogOwningBranch(params: {
  role: StaffRole;
  accessibleBranchCount: number;
}) {
  return params.role === "owner" && params.accessibleBranchCount > 1;
}

export async function getCatalogSharingSettings(
  supabase: any,
  branchId: string | null,
): Promise<CatalogSharingSettings> {
  if (!branchId) {
    return {
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: false,
    };
  }

  const { data, error } = await supabase
    .from("business_settings")
    .select("allow_global_product_catalog, allow_global_service_catalog")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    allowGlobalProductCatalog: data?.allow_global_product_catalog ?? false,
    allowGlobalServiceCatalog: data?.allow_global_service_catalog ?? false,
  };
}

export function resolveCatalogWriteBranchId(params: {
  requestedBranchId: string;
  writeBranchId: string;
  canSelectOwningBranch: boolean;
  accessibleBranchIds: string[];
}) {
  if (!params.canSelectOwningBranch) {
    return params.writeBranchId;
  }

  return params.accessibleBranchIds.includes(params.requestedBranchId)
    ? params.requestedBranchId
    : params.writeBranchId;
}

export function resolveCatalogPermissions(params: {
  role: StaffRole;
  accessibleBranchCount: number;
  capabilities: readonly AppCapability[];
}) {
  return {
    canCreateProducts: params.capabilities.includes("products:write"),
    canCreateServices: params.capabilities.includes("services:write"),
    canMarkGlobal: canMarkCatalogRecordGlobal(params.role),
    canSelectOwningBranch: canSelectCatalogOwningBranch({
      role: params.role,
      accessibleBranchCount: params.accessibleBranchCount,
    }),
  };
}
