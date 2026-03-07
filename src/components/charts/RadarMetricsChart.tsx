"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type RadarMetrics = {
  hook_strength: number;
  suspense_density: number;
  retention_stability: number;
};

const LABELS: Record<keyof RadarMetrics, string> = {
  hook_strength: "Hook",
  suspense_density: "Suspense",
  retention_stability: "Stability",
};

export function RadarMetricsChart({ metrics }: { metrics?: Partial<RadarMetrics> | null }) {
  const safeMetrics = metrics ?? {};
  const data = (Object.keys(LABELS) as Array<keyof RadarMetrics>).map((k) => ({
    key: k,
    label: LABELS[k],
    value: Number.isFinite(safeMetrics[k]) ? safeMetrics[k]! : 0,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          outerRadius={80}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid opacity={0.2} />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(2), "score"]}
          />
          <Radar
            dataKey="value"
            stroke="hsl(var(--foreground))"
            fill="hsl(var(--foreground))"
            fillOpacity={0.12}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

