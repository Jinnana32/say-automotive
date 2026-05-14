import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { MechanicPortalProfilePage } from "@/features/attendance/components/mechanic-portal-profile-page";

export const dynamic = "force-dynamic";

export default async function MechanicPortalProfileRoute() {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "mechanic") {
    redirect("/dashboard");
  }

  return (
    <MechanicPortalProfilePage
      displayName={context.displayName}
      role={context.role}
    />
  );
}
