"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, History, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const PORTAL_BOTTOM_NAV_ITEMS = [
  {
    href: "/portal/attendance",
    label: "Home",
    icon: Clock3,
  },
  {
    href: "/portal/amendments",
    label: "History",
    icon: History,
  },
  {
    href: "/portal/profile",
    label: "Profile",
    icon: UserRound,
  },
] as const;

export function MechanicPortalBottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:hidden">
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_-10px_30px_rgba(8,23,53,0.08)] backdrop-blur">
        <nav className="pointer-events-auto grid grid-cols-3 gap-2" aria-label="Portal navigation">
          {PORTAL_BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-[11px] font-medium transition",
                  isActive
                    ? "bg-[#081735] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#081735]",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
