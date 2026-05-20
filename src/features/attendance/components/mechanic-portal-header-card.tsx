"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";

import { MechanicPortalMenu } from "@/features/attendance/components/mechanic-portal-menu";

export function MechanicPortalHeaderCard({
  displayName,
}: {
  displayName: string;
}) {
  return (
    <div className="rounded-[1.85rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_22px_48px_rgba(8,23,53,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Image
            src="/say-auto-care-logo.jpeg"
            alt="SAY Auto Care Center"
            width={220}
            height={64}
            className="h-auto w-[10.5rem] object-contain object-left"
            priority
          />
          <div className="mt-3.5 flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[#0B1F4D]">
              <UserRound className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">
                {displayName}
              </p>
              <p className="text-sm text-slate-500">
                Mechanic - SAY Auto Care Center
              </p>
            </div>
          </div>
        </div>
        <div className="pt-8">
          <MechanicPortalMenu />
        </div>
      </div>
    </div>
  );
}
