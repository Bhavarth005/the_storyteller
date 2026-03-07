"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TensionCurvePoint = {
  time_sec?: number;
  tension?: number;
  time?: number;
  tension_score?: number;
};

const FALLBACK_CURVE: Array<{ time: number; tension_score: number }> = [
  { time: 0, tension_score: 0.42 },
  { time: 10, tension_score: 0.55 },
  { time: 20, tension_score: 0.49 },
  { time: 30, tension_score: 0.63 },
  { time: 40, tension_score: 0.7 },
  { time: 50, tension_score: 0.61 },
  { time: 60, tension_score: 0.66 },
  { time: 70, tension_score: 0.74 },
  { time: 80, tension_score: 0.81 },
  { time: 90, tension_score: 0.77 },
];

export function TensionCurveChart({
  data,
}: {
  data?: TensionCurvePoint[];
}) {
  const normalizedData =
    data
      ?.map((point) => ({
        time: point.time ?? point.time_sec ?? 0,
        tension_score: point.tension_score ?? point.tension ?? 0,
      }))
      .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.tension_score)) ?? [];

  const chartData = normalizedData.length > 0 ? normalizedData : FALLBACK_CURVE;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `${v}s`}
          />
          <YAxis
            domain={[0, 1]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <Tooltip
            formatter={(value) => [Number(value ?? 0).toFixed(2), "tension"]}
            labelFormatter={(label) => `${label ?? 0}s`}
          />
          <Line
            type="monotone"
            dataKey="tension_score"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

