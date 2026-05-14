"use client";

import { usePathname } from "next/navigation";

import { MechanicPortalMenu } from "@/features/attendance/components/mechanic-portal-menu";

const PORTAL_SUBTITLE_BY_PATH = {
  "/portal/attendance": "Mechanic attendance",
  "/portal/history": "Attendance history",
  "/portal/amendments": "DTR amendments",
  "/portal/profile": "Account profile",
} as const;

export function MechanicPortalHeaderCard({
  displayName,
}: {
  displayName: string;
}) {
  const pathname = usePathname();
  const subtitle =
    PORTAL_SUBTITLE_BY_PATH[pathname as keyof typeof PORTAL_SUBTITLE_BY_PATH] ??
    "Mechanic attendance";

  return (
    <div className="flex items-start justify-between rounded-[1.75rem] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_20px_45px_rgba(8,23,53,0.06)]">
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          SAY Auto Care Center
        </p>
        <p className="truncate text-lg font-semibold text-slate-950">{displayName}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <MechanicPortalMenu />
    </div>
  );
}
