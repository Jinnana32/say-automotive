import { cn } from "@/lib/utils";

export function ReportSectionHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-1.5 flex items-center gap-2.5", className)}>
      <span className="bg-brand-navy px-3 py-1.25 text-[10.25px] font-semibold tracking-[0.22em] text-white">
        {title}
      </span>
      <span className="h-[2px] flex-1 bg-brand-border" />
    </div>
  );
}
