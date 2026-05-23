import { describe, expect, it, vi } from "vitest";

import {
  applyCatalogVisibilityFilter,
  canManageCatalogRecord,
  canMarkCatalogRecordGlobal,
  canSelectCatalogOwningBranch,
  getCatalogSharingSettings,
  isGlobalCatalogSharingEnabled,
  resolveCatalogPermissions,
  resolveCatalogWriteBranchId,
} from "@/lib/catalog-visibility";

describe("catalog visibility helpers", () => {
  it("filters to the branch only when global sharing is disabled", () => {
    const eq = vi.fn().mockReturnValue("eq-result");
    const or = vi.fn().mockReturnValue("or-result");

    const result = applyCatalogVisibilityFilter(
      { eq, or },
      { branchId: "branch-1", includeGlobal: false },
    );

    expect(result).toBe("eq-result");
    expect(eq).toHaveBeenCalledWith("branch_id", "branch-1");
    expect(or).not.toHaveBeenCalled();
  });

  it("includes global records when sharing is enabled", () => {
    const eq = vi.fn().mockReturnValue("eq-result");
    const or = vi.fn().mockReturnValue("or-result");

    const result = applyCatalogVisibilityFilter(
      { eq, or },
      { branchId: "branch-1", includeGlobal: true },
    );

    expect(result).toBe("or-result");
    expect(or).toHaveBeenCalledWith("branch_id.eq.branch-1,is_global.eq.true");
    expect(eq).not.toHaveBeenCalled();
  });

  it("falls back to disabled sharing settings when no branch settings exist", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const settings = await getCatalogSharingSettings({ from }, "branch-1");

    expect(settings).toEqual({
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: false,
    });
  });

  it("resolves ownership and sharing permissions from role and branch access", () => {
    expect(canMarkCatalogRecordGlobal("owner")).toBe(true);
    expect(canMarkCatalogRecordGlobal("admin")).toBe(true);
    expect(canMarkCatalogRecordGlobal("inventory_staff")).toBe(false);

    expect(
      canSelectCatalogOwningBranch({
        role: "owner",
        accessibleBranchCount: 2,
      }),
    ).toBe(true);

    expect(
      canSelectCatalogOwningBranch({
        role: "admin",
        accessibleBranchCount: 2,
      }),
    ).toBe(false);

    expect(
      canManageCatalogRecord({
        ownerBranchId: "branch-1",
        writeBranchId: "branch-1",
        canAccessAllBranches: false,
      }),
    ).toBe(true);

    expect(
      canManageCatalogRecord({
        ownerBranchId: "branch-2",
        writeBranchId: "branch-1",
        canAccessAllBranches: false,
      }),
    ).toBe(false);

    expect(
      resolveCatalogPermissions({
        role: "owner",
        accessibleBranchCount: 2,
        capabilities: ["products:write", "services:write"],
      }),
    ).toEqual({
      canCreateProducts: true,
      canCreateServices: true,
      canMarkGlobal: true,
      canSelectOwningBranch: true,
    });
  });

  it("falls back to the write branch when the requested owner branch is invalid", () => {
    expect(
      resolveCatalogWriteBranchId({
        requestedBranchId: "branch-2",
        writeBranchId: "branch-1",
        canSelectOwningBranch: true,
        accessibleBranchIds: ["branch-1"],
      }),
    ).toBe("branch-1");
  });

  it("reports sharing enablement by catalog kind", () => {
    expect(
      isGlobalCatalogSharingEnabled(
        {
          allowGlobalProductCatalog: true,
          allowGlobalServiceCatalog: false,
        },
        "product",
      ),
    ).toBe(true);

    expect(
      isGlobalCatalogSharingEnabled(
        {
          allowGlobalProductCatalog: true,
          allowGlobalServiceCatalog: false,
        },
        "service",
      ),
    ).toBe(false);
  });
});
