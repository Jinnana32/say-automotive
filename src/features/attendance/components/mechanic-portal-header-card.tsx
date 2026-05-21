"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import { MechanicPortalMenu } from "@/features/attendance/components/mechanic-portal-menu";

export function MechanicPortalHeaderCard({
  displayName,
}: {
  displayName: string;
}) {
  return (
    <div
      aria-label="Mechanic identity"
      className="rounded-[1.85rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_22px_48px_rgba(8,23,53,0.06)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandLogo
            markSrc="/say-auto-care-shield.png"
            alt="SAY Auto Care Center shield"
            variant="mark"
            width={42}
            height={42}
            className="h-[2.6rem] w-[2.6rem] shrink-0 object-contain"
            priority
            fallbackClassName="h-[2.6rem] w-[2.6rem]"
          />
          <div className="min-w-0">
            <p className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">
              {displayName}
            </p>
            <p className="text-sm text-slate-500">Mechanic • SAY Auto Care Center</p>
          </div>
        </div>

        <div className="shrink-0">
          <MechanicPortalMenu />
        </div>
      </div>
    </div>
  );
}
