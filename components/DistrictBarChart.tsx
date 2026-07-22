import { useState } from "react";

/**
 * DistrictBarChart — Horizontal bar chart showing top districts by report count.
 * Custom SVG implementation for zero dependency overhead.
 * Shows total bars with incident/grievance breakdown as segmented colors.
 * Hover tooltip appears below each bar for full visibility.
 */

interface DistrictData {
  name: string;
  total: number;
  incidents: number;
  grievances: number;
}

interface DistrictBarChartProps {
  data: DistrictData[];
  loading?: boolean;
}

export default function DistrictBarChart({ data, loading }: DistrictBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-code text-sm text-text-muted">
          <span className="term-info">$</span> এখনো কোনো ডাটা নেই।
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.total), 1);

  // Only take top 10 for display
  const topData = data.slice(0, 10).reverse();

  const barHeight = 28;
  const gap = 6;
  const tooltipHeight = 20;
  const extraBottomPadding = 10;
  // Increase chart height to accommodate tooltips below each bar
  const chartHeight = topData.length * (barHeight + gap) + 20 + tooltipHeight + extraBottomPadding;
  const labelWidth = 100;
  const chartWidth = 400;
  const totalWidth = labelWidth + chartWidth + 60;

  return (
    <div className="overflow-visible">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${totalWidth} ${chartHeight}`}
        className="overflow-visible"
        style={{ overflow: "visible" }}
      >
        {/* Bars */}
        {topData.map((d, i) => {
          const y = i * (barHeight + gap) + 10;
          const totalWidthPx = (d.total / maxCount) * chartWidth;
          const incidentsWidth = (d.incidents / d.total) * totalWidthPx || 0;
          const grievancesWidth = (d.grievances / d.total) * totalWidthPx || 0;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={d.name}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* District name label */}
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                fill={isHovered ? "#F1F5F9" : "#94A3B8"}
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="end"
              >
                {d.name}
              </text>

              {/* Background bar */}
              <rect
                x={labelWidth}
                y={y}
                width={totalWidthPx}
                height={barHeight}
                fill="rgba(255,255,255,0.04)"
                rx="3"
              />

              {/* Incidents segment (red) */}
              {incidentsWidth > 0 && (
                <rect
                  x={labelWidth}
                  y={y}
                  width={incidentsWidth}
                  height={barHeight}
                  fill="#DC2626"
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  rx={grievancesWidth === 0 ? "3" : "3 0 0 3"}
                />
              )}

              {/* Grievances segment (teal) */}
              {grievancesWidth > 0 && (
                <rect
                  x={labelWidth + incidentsWidth}
                  y={y}
                  width={grievancesWidth}
                  height={barHeight}
                  fill="#0D9488"
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  rx={incidentsWidth === 0 ? "3" : "0 3 3 0"}
                />
              )}

              {/* Count label */}
              <text
                x={labelWidth + totalWidthPx + 6}
                y={y + barHeight / 2 + 4}
                fill={isHovered ? "#F1F5F9" : "#64748B"}
                fontSize="10"
                fontFamily="'VT323', monospace"
              >
                {d.total}
              </text>

              {/* Hover tooltip — positioned BELOW the bar for full visibility */}
              {isHovered && (
                <g>
                  {/* Background — full width, below the bar */}
                  <rect
                    x={0}
                    y={y + barHeight + 2}
                    width={labelWidth + chartWidth - 10}
                    height={tooltipHeight}
                    fill="rgba(11,20,35,0.95)"
                    rx="4"
                    stroke="rgba(13,148,136,0.4)"
                    strokeWidth="1"
                  />
                  {/* District name */}
                  <text
                    x={10}
                    y={y + barHeight + tooltipHeight / 2 + 1}
                    fill="#F1F5F9"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="600"
                  >
                    {d.name}
                  </text>
                  {/* Divider */}
                  <text
                    x={labelWidth - 4}
                    y={y + barHeight + tooltipHeight / 2 + 1}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="'VT323', monospace"
                  >
                    │
                  </text>
                  {/* Incidents */}
                  <text
                    x={labelWidth + 6}
                    y={y + barHeight + tooltipHeight / 2 + 1}
                    fill="#DC2626"
                    fontSize="10"
                    fontFamily="'VT323', monospace"
                  >
                    ● ঘটনা: {d.incidents}
                  </text>
                  {/* Grievances */}
                  <text
                    x={labelWidth + 90}
                    y={y + barHeight + tooltipHeight / 2 + 1}
                    fill="#0D9488"
                    fontSize="10"
                    fontFamily="'VT323', monospace"
                  >
                    ● অভিযোগ: {d.grievances}
                  </text>
                  {/* Total */}
                  <text
                    x={labelWidth + 180}
                    y={y + barHeight + tooltipHeight / 2 + 1}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="'VT323', monospace"
                  >
                    = মোট: {d.total}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#DC2626]" />
          <span className="font-code text-[10px] text-text-muted">ঘটনা</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#0D9488]" />
          <span className="font-code text-[10px] text-text-muted">অভিযোগ</span>
        </div>
      </div>
    </div>
  );
}