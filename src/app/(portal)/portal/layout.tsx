import { redirect } from "next/navigation";

import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { MechanicPortalBottomNav } from "@/features/attendance/components/mechanic-portal-bottom-nav";
import { MechanicPortalDeviceBootstrap } from "@/features/attendance/components/mechanic-portal-device-bootstrap";
import { MechanicPortalHeaderCard } from "@/features/attendance/components/mechanic-portal-header-card";

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
    <div className="min-h-screen bg-[#F5F7FB] px-4 py-5 md:py-6">
      <div className="mx-auto max-w-[30rem] space-y-4 pb-24 md:space-y-5 md:pb-6">
        <MechanicPortalDeviceBootstrap />
        <MechanicPortalHeaderCard displayName={context.displayName} />

        {children}
      </div>
      <MechanicPortalBottomNav />
    </div>
  );
}
