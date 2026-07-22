import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * TrendChart — Line chart showing report trends over time.
 * Dark-theme styled to match Nirbhoy's terminal aesthetic.
 * Shows total, incidents, and grievances per month.
 */

interface MonthlyData {
  month: string;
  total: number;
  incidents: number;
  grievances: number;
}

interface TrendChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

export default function TrendChart({ data, loading }: TrendChartProps) {
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    total: true,
    incidents: true,
    grievances: true,
  });

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      ...d,
      // Format month label for display
      monthLabel: formatMonth(d.month),
    }));
  }, [data]);

  function toggleLine(key: string) {
    setActiveLines((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="rounded-md border border-borderStrong bg-elevated/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <p className="font-terminal text-xs text-accent mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p
            key={i}
            className="font-code text-xs leading-relaxed"
            style={{ color: entry.color }}
          >
            {entry.name === "total" && "সর্বমোট: "}
            {entry.name === "incidents" && "ঘটনা: "}
            {entry.name === "grievances" && "অভিযোগ: "}
            <span className="text-text-primary font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const lineConfig = [
    { key: "total", color: "#0D9488", label: "সর্বমোট" },
    { key: "incidents", color: "#DC2626", label: "ঘটনা" },
    { key: "grievances", color: "#14B8A6", label: "অভিযোগ" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading chart...</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-elevated/40 rounded-md border border-border">
        <p className="font-code text-sm text-text-muted">
          <span className="term-info">$</span> এখনো কোনো ডাটা নেই।
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend toggle */}
      <div className="mb-4 flex flex-wrap gap-2">
        {lineConfig.map(({ key, color, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleLine(key)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-terminal text-[11px] transition-all duration-200 ${
              activeLines[key]
                ? "border-accent/30 bg-accent-soft/40 text-accent"
                : "border-borderStrong text-text-faint opacity-50 hover:opacity-80"
            }`}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border bg-elevated/60 p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "#64748B", fontSize: 10, fontFamily: "'VT323', monospace" }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 10, fontFamily: "'VT323', monospace" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {lineConfig
              .filter(({ key }) => activeLines[key])
              .map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "rgba(11,20,35,0.8)", strokeWidth: 2 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const monthNames = [
    "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে",
  ];
  const idx = parseInt(m, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${monthNames[idx]} ${year}`;
  }
  return month;
}