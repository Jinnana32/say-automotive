import { cn } from "@/lib/utils";

export function MechanicPortalSectionIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D62828]">
        {eyebrow}
      </p>
      <h1 className="text-[1.95rem] font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h1>
      <p className="max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
