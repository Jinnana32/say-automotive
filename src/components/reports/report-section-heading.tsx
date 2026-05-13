import { cn } from "@/lib/utils";

export function ReportSectionHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center gap-3", className)}>
      <span className="bg-[#173c99] px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.24em] text-white">
        {title}
      </span>
      <span className="h-[2px] flex-1 bg-[#c73d3d]" />
    </div>
  );
}
