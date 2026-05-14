import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { MechanicPortalSectionIntro } from "@/features/attendance/components/mechanic-portal-section-intro";
import { formatStaffRoleLabel } from "@/features/attendance/utils";
import type { StaffRole } from "@/lib/auth/permissions";

export function MechanicPortalProfilePage({
  displayName,
  role,
}: {
  displayName: string;
  role: StaffRole;
}) {
  return (
    <div className="space-y-4">
      <MechanicPortalSectionIntro
        eyebrow="Profile"
        title="Account"
        description="Review your portal access details and sign out when you finish your shift."
      />

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#EAF1FB] text-[#081735]">
            <UserRound className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-950">{displayName}</p>
            <p className="text-sm text-slate-500">{formatStaffRoleLabel(role)}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Portal access
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this mobile portal only while connected to the approved shop network and using your approved attendance device.
          </p>
        </div>

        <form action={signOutAction} className="mt-5">
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full rounded-[1.2rem] border-[#0B1F4D]/20 text-sm font-semibold text-[#0B1F4D] hover:bg-[#EAF1FB]"
          >
            Sign out
          </Button>
        </form>
      </section>
    </div>
  );
}
