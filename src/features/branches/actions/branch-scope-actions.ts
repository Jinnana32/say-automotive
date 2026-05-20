"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ALL_BRANCHES_SCOPE_VALUE, BRANCH_SCOPE_COOKIE_NAME } from "@/lib/branch-scope";
import {
  listAccessibleBranches,
} from "@/lib/branches";

export async function updateSelectedBranchScopeAction(formData: FormData) {
  const rawSelection = readString(formData, "branchScope");
  const redirectTo = readString(formData, "redirectTo") || "/dashboard";
  const { accessibleBranches, canAccessAllBranches, currentUserBranchId } = await listAccessibleBranches();
  const cookieStore = await cookies();

  if (canAccessAllBranches && rawSelection === ALL_BRANCHES_SCOPE_VALUE) {
    cookieStore.set(BRANCH_SCOPE_COOKIE_NAME, ALL_BRANCHES_SCOPE_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect(redirectTo);
  }

  const branch = accessibleBranches.find((item) => item.id === rawSelection);

  if (branch) {
    cookieStore.set(BRANCH_SCOPE_COOKIE_NAME, branch.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect(redirectTo);
  }

  if (currentUserBranchId) {
    cookieStore.set(BRANCH_SCOPE_COOKIE_NAME, currentUserBranchId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } else {
    cookieStore.delete(BRANCH_SCOPE_COOKIE_NAME);
  }

  redirect(redirectTo);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
