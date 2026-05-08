import { cn } from "@/lib/utils";

export type ReportTotalLine = {
  label: string;
  value: string;
  emphasized?: boolean;
};

export function ReportTotals({
  lines,
  className,
}: {
  lines: ReportTotalLine[];
  className?: string;
}) {
  return (
    <div className={cn("w-full max-w-[250px] text-[12px]", className)}>
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line) => (
            <tr key={line.label}>
              <td className={cn("py-1 pr-4 font-semibold text-slate-700", line.emphasized ? "text-slate-950" : "")}>
                {line.label}
              </td>
              <td
                className={cn(
                  "py-1 text-right font-semibold text-slate-700",
                  line.emphasized ? "text-[14px] text-slate-950" : "",
                )}
              >
                {line.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
