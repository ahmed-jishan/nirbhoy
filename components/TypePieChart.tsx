import { useState, useEffect, useRef } from "react";

/**
 * TypePieChart — Custom SVG pie chart showing incident vs grievance distribution.
 * Built without external chart libraries for zero dependency overhead.
 * Dark-theme styled to match Nirbhoy's terminal aesthetic.
 */

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface TypePieChartProps {
  incidents: number;
  grievances: number;
  loading?: boolean;
}

export default function TypePieChart({ incidents, grievances, loading }: TypePieChartProps) {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const data: PieData[] = [
    { name: "অপরাধ / ঘটনা", value: incidents, color: "#DC2626" },
    { name: "সাধারণ অভিযোগ", value: grievances, color: "#0D9488" },
  ];

  const total = incidents + grievances;
  const validData = data.filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading chart...</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-code text-sm text-text-muted">
          <span className="term-info">$</span> এখনো কোনো ডাটা নেই।
        </p>
      </div>
    );
  }

  // SVG pie chart with arc paths
  const cx = 120;
  const cy = 120;
  const radius = 100;
  const innerRadius = 55; // Donut hole

  function polarToCartesian(
    centerX: number,
    centerY: number,
    r: number,
    angleInDegrees: number
  ): { x: number; y: number } {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  }

  function describeArc(
    startAngle: number,
    endAngle: number,
    outerR: number = radius,
    innerR: number = innerRadius
  ): string {
    const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = polarToCartesian(cx, cy, innerR, startAngle);
    const endInner = polarToCartesian(cx, cy, innerR, endAngle);

    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${arcSweep} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${arcSweep} 1 ${endInner.x} ${endInner.y}`,
      "Z",
    ].join(" ");
  }

  let currentAngle = 0;
  const slices = validData.map((d, i) => {
    const sliceAngle = (d.value / total) * 360;
    const path = describeArc(currentAngle, currentAngle + sliceAngle);
    const midAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius + 20;
    const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);
    currentAngle += sliceAngle;
    return { ...d, path, labelPos, percentage: ((d.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" height="280" viewBox="0 0 240 240">
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* Slices */}
        {slices.map((slice, i) => (
          <g key={i}>
            <path
              d={slice.path}
              fill={slice.color}
              fillOpacity={activeSlice === i ? 0.9 : 0.6}
              stroke="rgba(11,20,35,0.8)"
              strokeWidth="2"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setActiveSlice(i)}
              onMouseLeave={() => setActiveSlice(null)}
            />
            {/* Percentage label */}
            {parseFloat(slice.percentage) > 5 && (
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y}
                fill="#F1F5F9"
                fontSize="11"
                fontFamily="'VT323', monospace"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {slice.percentage}%
              </text>
            )}
          </g>
        ))}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 8}
          fill="#F1F5F9"
          fontSize="22"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          fill="#64748B"
          fontSize="10"
          fontFamily="'VT323', monospace"
          textAnchor="middle"
        >
          মোট
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {slices.map((slice, i) => (
          <div
            key={i}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-code text-xs transition-all duration-200 cursor-pointer ${
              activeSlice === i
                ? "border-accent/40 bg-accent-soft/40"
                : "border-borderStrong bg-elevated/60"
            }`}
            onMouseEnter={() => setActiveSlice(i)}
            onMouseLeave={() => setActiveSlice(null)}
          >
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-text-primary">{slice.name}</span>
            <span className="text-text-faint">{slice.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}