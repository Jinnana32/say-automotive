import { cache } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import {
  getRoleCapabilities,
  hasCapability,
  type AppCapability,
  type StaffRole,
} from "@/lib/auth/permissions";

type StaffRow = TableRow<"staff">;

export type AuthenticatedStaffContext = {
  userId: string;
  email: string | null;
  staffId: string;
  role: StaffRole;
  displayName: string;
  branchId: string | null;
  capabilities: readonly AppCapability[];
};

export type AppSessionState =
  | {
      status: "anonymous";
    }
  | {
      status: "inactive";
      userId: string;
      email: string | null;
    }
  | {
      status: "authenticated";
      context: AuthenticatedStaffContext;
    };

export const getAppSessionState = cache(async (): Promise<AppSessionState> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "anonymous" };
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, first_name, last_name, branch_id, role, status")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (!staff || staff.status !== "active") {
    return {
      status: "inactive",
      userId: user.id,
      email: user.email ?? null,
    };
  }

  return {
    status: "authenticated",
    context: mapStaffContext(user.id, user.email ?? null, staff),
  };
});

export async function requireAuthenticatedStaff() {
  const session = await getAppSessionState();

  if (session.status === "anonymous") {
    redirect("/login");
  }

  if (session.status === "inactive") {
    redirect("/login?reason=inactive");
  }

  return session.context;
}

export async function requireStaffCapability(capability: AppCapability) {
  const context = await requireAuthenticatedStaff();

  if (!hasCapability(context.role, capability)) {
    redirect("/forbidden");
  }

  return context;
}

export async function getAuthorizedSupabaseServerClient(capability: AppCapability) {
  const context = await requireStaffCapability(capability);
  const supabase = await getSupabaseServerClient();

  return { context, supabase };
}

function mapStaffContext(userId: string, email: string | null, staff: Pick<
  StaffRow,
  "id" | "first_name" | "last_name" | "branch_id" | "role"
>): AuthenticatedStaffContext {
  return {
    userId,
    email,
    staffId: staff.id,
    role: staff.role,
    displayName: `${staff.first_name} ${staff.last_name}`.trim(),
    branchId: staff.branch_id,
    capabilities: getRoleCapabilities(staff.role),
  };
}
