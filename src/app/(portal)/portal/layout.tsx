import { redirect } from "next/navigation";

import { getDefaultBranch } from "@/lib/branches";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { buildBusinessLogoUrl } from "@/lib/storage";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const branchId = context.branchId ?? (await getDefaultBranch()).id;
  const admin = getSupabaseAdminClient();
  const { data: businessSettings, error: businessSettingsError } = await admin
    .from("business_settings")
    .select("business_logo_path, updated_at")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (businessSettingsError) {
    throw new Error(businessSettingsError.message);
  }

  const businessLogoUrl = buildBusinessLogoUrl(
    businessSettings?.business_logo_path ?? null,
    businessSettings?.updated_at ?? null,
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-4 py-5 md:py-6">
      <div className="mx-auto max-w-[30rem] space-y-4 pb-24 md:space-y-5 md:pb-6">
        <MechanicPortalDeviceBootstrap />
        <MechanicPortalHeaderCard
          displayName={context.displayName}
          businessLogoUrl={businessLogoUrl}
        />

        {children}
      </div>
      <MechanicPortalBottomNav />
    </div>
  );
}
