"use client";

import { useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { NativeSelect } from "@/components/ui/native-select";
import { updateSelectedBranchScopeAction } from "@/features/branches/actions/branch-scope-actions";
import { ALL_BRANCHES_SCOPE_VALUE } from "@/lib/branch-scope";

export function BranchScopeSelector({
  canAccessAllBranches,
  accessibleBranches,
  selectedBranchId,
  selectedBranchLabel,
}: {
  canAccessAllBranches: boolean;
  accessibleBranches: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  selectedBranchId: string | null;
  selectedBranchLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  if (!canAccessAllBranches) {
    return (
      <div className="rounded-full border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
        {selectedBranchLabel}
      </div>
    );
  }

  const value = selectedBranchId ?? ALL_BRANCHES_SCOPE_VALUE;

  return (
    <form action={updateSelectedBranchScopeAction} ref={formRef}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="sr-only" htmlFor="branch-scope-selector">
        Branch scope
      </label>
      <NativeSelect
        id="branch-scope-selector"
        name="branchScope"
        value={value}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-10 min-w-44 rounded-full border-border/70 bg-background/90 text-sm shadow-sm"
      >
        <option value={ALL_BRANCHES_SCOPE_VALUE}>All branches</option>
        {accessibleBranches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} ({branch.code})
          </option>
        ))}
      </NativeSelect>
    </form>
  );
}
