import { cn } from "@/lib/utils";

export function ReportSignatureBlock({
  label,
  name,
  subtitle,
  align = "left",
}: {
  label: string;
  name?: string | null;
  subtitle?: string | null;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("report-section-keep", align === "center" ? "text-center" : "text-left")}>
      <div className={cn("pt-6", align === "center" ? "mx-auto w-44" : "w-44")}>
        <div className="border-t border-slate-500" />
      </div>
      <p className="mt-2 text-[10px] font-semibold text-slate-700">{label}</p>
      {name ? <p className="mt-2 text-[11px] font-semibold text-slate-950">{name}</p> : null}
      {subtitle ? <p className="mt-1 text-[10px] text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
