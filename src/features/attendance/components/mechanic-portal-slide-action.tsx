import { ArrowRight, ChevronsRight } from "lucide-react";

import { SubmitButton } from "@/components/shared/submit-button";
import { cn } from "@/lib/utils";

export function MechanicPortalSlideAction({
  children,
  disabled,
  pendingLabel,
  className,
}: {
  children: string;
  disabled?: boolean;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <SubmitButton
      pendingLabel={pendingLabel}
      disabled={disabled}
      className={cn(
        "h-auto w-full rounded-[1.75rem] bg-[#081735] px-3 py-3 text-left text-white shadow-[0_18px_35px_rgba(8,23,53,0.22)] hover:bg-[#0B1F4D]",
        "disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/14">
          <ArrowRight className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold tracking-[0.08em] text-white">
            {children}
          </span>
          <ChevronsRight className="size-5 shrink-0 text-white/80" />
        </span>
      </span>
    </SubmitButton>
  );
}
