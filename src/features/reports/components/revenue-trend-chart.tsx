import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueTrendPoint, ReportGroupBy } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";

const SVG_HEIGHT = 260;
const SVG_WIDTH = 860;
const PADDING = { top: 20, right: 20, bottom: 48, left: 40 };
const REPORT_NAVY = "#0B1F4D";
const REPORT_NAVY_MUTED = "#B7C7E3";
const REPORT_RED_ACCENT = "#D62828";
const REPORT_GRID = "#E5E7EB";

export function RevenueTrendChart({
  data,
  groupBy,
}: {
  data: RevenueTrendPoint[];
  groupBy: ReportGroupBy;
}) {
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const maxRevenue = Math.max(...data.map((point) => point.paymentsCollected), 0);
  const maxReleased = Math.max(...data.map((point) => point.vehiclesReleased), 0);
  const labelStride = Math.max(1, Math.ceil(data.length / 8));

  const points = data.map((point, index) => {
    const step = data.length > 1 ? chartWidth / data.length : chartWidth;
    const x = PADDING.left + step * index + step / 2;
    const barWidth = Math.max(Math.min(step * 0.5, 28), 12);
    const releasedHeight = maxReleased > 0 ? (point.vehiclesReleased / maxReleased) * chartHeight : 0;
    const revenueY =
      maxRevenue > 0
        ? PADDING.top + chartHeight - (point.paymentsCollected / maxRevenue) * chartHeight
        : PADDING.top + chartHeight;

    return {
      ...point,
      x,
      barX: x - barWidth / 2,
      barWidth,
      releasedY: PADDING.top + chartHeight - releasedHeight,
      releasedHeight,
      revenueY,
      showLabel: index % labelStride === 0 || index === data.length - 1,
    };
  });

  const revenuePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.revenueY}`)
    .join(" ");

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Revenue and service trend</CardTitle>
        <CardDescription>
          Payments collected and vehicles released, grouped {groupBy}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <LegendSwatch color={REPORT_NAVY_MUTED} label="Vehicles released" />
          <LegendSwatch color={REPORT_NAVY} label="Payments collected" />
        </div>

        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trend data in the selected period.</p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="min-w-[720px]"
              role="img"
              aria-label="Trend chart for payments collected and vehicles released"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = PADDING.top + chartHeight - ratio * chartHeight;
                return (
                  <line
                    key={ratio}
                    x1={PADDING.left}
                    x2={SVG_WIDTH - PADDING.right}
                    y1={y}
                    y2={y}
                    stroke={REPORT_GRID}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {points.map((point) => (
                <g key={point.key}>
                  <rect
                    x={point.barX}
                    y={point.releasedY}
                    width={point.barWidth}
                    height={Math.max(point.releasedHeight, 2)}
                    rx="6"
                    fill={REPORT_NAVY_MUTED}
                    opacity="0.95"
                  />
                  {point.showLabel ? (
                    <text
                      x={point.x}
                      y={SVG_HEIGHT - 16}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px]"
                    >
                      {point.label}
                    </text>
                  ) : null}
                </g>
              ))}

              {revenuePath ? (
                <>
                  <path d={revenuePath} fill="none" stroke={REPORT_NAVY} strokeWidth="3" />
                  {points.map((point) => (
                    <circle
                      key={`${point.key}-circle`}
                      cx={point.x}
                      cy={point.revenueY}
                      r="4"
                      fill={REPORT_RED_ACCENT}
                    />
                  ))}
                </>
              ) : null}
            </svg>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <MiniSummary
            label="Total payments collected"
            value={formatCurrency(data.reduce((sum, point) => sum + point.paymentsCollected, 0))}
          />
          <MiniSummary
            label="Total vehicles released"
            value={String(data.reduce((sum, point) => sum + point.vehiclesReleased, 0))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
