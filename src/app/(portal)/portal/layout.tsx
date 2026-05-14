import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { MechanicPortalBottomNav } from "@/features/attendance/components/mechanic-portal-bottom-nav";
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
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-5 md:py-6">
      <div className="mx-auto max-w-xl space-y-4 pb-24 md:space-y-5 md:pb-6">
        <MechanicPortalDeviceBootstrap />
        <div className="flex items-start justify-between rounded-[1.75rem] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_20px_45px_rgba(8,23,53,0.06)]">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              SAY Auto Care Center
            </p>
            <p className="truncate text-lg font-semibold text-slate-950">{context.displayName}</p>
            <p className="text-sm text-slate-500">Mechanic attendance</p>
          </div>
          <MechanicPortalMenu />
        </div>

        {children}
      </div>
      <MechanicPortalBottomNav />
    </div>
  );
}
