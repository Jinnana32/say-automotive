import type { StaffRole } from "@/lib/auth/permissions";
import type { AuthenticatedStaffContext } from "@/lib/auth/session";

export type PreparedByProfile = {
  name: string;
  title: string | null;
};

export function buildPreparedByProfile(
  context: Pick<
    AuthenticatedStaffContext,
    "displayName" | "email" | "role" | "documentTitle"
  >,
): PreparedByProfile {
  return {
    name: resolvePreparedByName(context),
    title: resolvePreparedByTitle(context),
  };
}

export function formatStaffRoleTitle(role: StaffRole) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function resolvePreparedByTitle(
  context: Pick<AuthenticatedStaffContext, "role" | "documentTitle">,
) {
  const documentTitle = context.documentTitle?.trim();

  if (documentTitle) {
    return documentTitle;
  }

  return formatStaffRoleTitle(context.role);
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
