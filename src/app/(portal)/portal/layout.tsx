import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { MechanicPortalDeviceBootstrap } from "@/features/attendance/components/mechanic-portal-device-bootstrap";
import { MechanicPortalMenu } from "@/features/attendance/components/mechanic-portal-menu";

export default async function MechanicPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireAuthenticatedStaff();

  if (context.role !== "mechanic") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-dashboard-grid px-4 py-5">
      <div className="mx-auto max-w-xl space-y-5">
        <MechanicPortalDeviceBootstrap />
        <div className="flex items-start justify-between rounded-[1.75rem] border border-border/70 bg-background/95 px-5 py-4 shadow-[0_24px_80px_rgba(14,34,61,0.08)]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              SAY Auto Care Center
            </p>
            <p className="text-lg font-semibold text-foreground">{context.displayName}</p>
            <p className="text-sm text-muted-foreground">Mechanic attendance portal</p>
          </div>
          <MechanicPortalMenu />
        </div>

        {children}
      </div>
    </div>
  );
}
