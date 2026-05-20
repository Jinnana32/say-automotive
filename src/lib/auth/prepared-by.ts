import type { StaffRole } from "@/lib/auth/permissions";
import type { AuthenticatedStaffContext } from "@/lib/auth/session";

export type PreparedByProfile = {
  name: string;
  title: string | null;
};

export function buildPreparedByProfile(
  context: Pick<AuthenticatedStaffContext, "displayName" | "email" | "role">,
): PreparedByProfile {
  return {
    name: resolvePreparedByName(context),
    title: formatStaffRoleTitle(context.role),
  };
}

export function formatStaffRoleTitle(role: StaffRole) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function resolvePreparedByName(
  context: Pick<AuthenticatedStaffContext, "displayName" | "email">,
) {
  const displayName = context.displayName.trim();

  if (displayName) {
    return displayName;
  }

  const email = context.email?.trim();

  if (email) {
    return email;
  }

  return "Prepared by current user";
}
