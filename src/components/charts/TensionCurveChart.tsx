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

export type TensionCurvePoint = { time_sec: number; tension: number };

export function TensionCurveChart({
  data,
}: {
  data: TensionCurvePoint[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="time_sec"
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
            formatter={(value) => [Number(value).toFixed(2), "tension"]}
            labelFormatter={(label) => `${label}s`}
          />
          <Line
            type="monotone"
            dataKey="tension"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

