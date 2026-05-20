import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function MechanicPortalVerificationCard({
  icon,
  title,
  subtitle,
  tone = "success",
  showChevron = true,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone?: "success" | "warning";
  showChevron?: boolean;
}) {
  const toneClasses =
    tone === "success"
      ? {
          card: "border-slate-200 bg-white",
          icon: "bg-emerald-100 text-emerald-700",
          title: "text-slate-950",
          subtitle: "text-slate-500",
          chevron: "text-slate-400",
        }
      : {
          card: "border-slate-200 bg-white",
          icon: "bg-amber-100 text-amber-700",
          title: "text-slate-950",
          subtitle: "text-slate-500",
          chevron: "text-slate-400",
        };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.03)]",
        toneClasses.card,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          toneClasses.icon,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", toneClasses.title)}>{title}</p>
        <p className={cn("truncate text-xs leading-5", toneClasses.subtitle)}>{subtitle}</p>
      </div>
      {showChevron ? <ChevronRight className={cn("size-4 shrink-0", toneClasses.chevron)} /> : null}
    </div>
  );
}
