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

export function RadarMetricsChart({ metrics }: { metrics: RadarMetrics }) {
  const data = (Object.keys(LABELS) as Array<keyof RadarMetrics>).map((k) => ({
    key: k,
    label: LABELS[k],
    value: metrics[k],
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
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

