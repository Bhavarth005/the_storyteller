"use client";

import { cn } from "@/lib/utils";

export type ScriptSegment = {
  start_sec: number;
  end_sec: number;
  text: string;
  emotion: string;
  drop_probability: number;
  engagement_score: number;
};

function segmentColor(segment: ScriptSegment) {
  if (segment.drop_probability > 0.7) return "bg-red-500/70";
  if (segment.drop_probability > 0.4) return "bg-yellow-400/70";
  return "bg-emerald-500/70";
}

export function EpisodeHeatmap({
  segments,
  className,
  onSelectSegment,
}: {
  segments?: ScriptSegment[] | null;
  className?: string;
  onSelectSegment?: (segment: ScriptSegment) => void;
}) {
  const safeSegments = segments ?? [];
  const normalizedSegments = Array.from({ length: 9 }, (_, idx) => {
    const existing = safeSegments[idx];
    if (existing) {
      return {
        ...existing,
        start_sec: idx * 10,
        end_sec: (idx + 1) * 10,
      };
    }

    return {
      start_sec: idx * 10,
      end_sec: (idx + 1) * 10,
      text: "",
      emotion: "neutral",
      drop_probability: 0,
      engagement_score: 0,
    } satisfies ScriptSegment;
  });

  const segmentCount = normalizedSegments.length;
  const widthPct = segmentCount > 0 ? 100 / segmentCount : 0;

  return (
    <div
      className={cn(
        "flex h-3 w-full overflow-hidden rounded-md border bg-muted/30",
        className,
      )}
      role="list"
      aria-label="Episode retention heatmap"
    >
      {normalizedSegments.map((s, idx) => {
        return (
          <button
            key={`${s.start_sec}-${s.end_sec}-${idx}`}
            type="button"
            role="listitem"
            aria-label={`Segment ${idx * 10}-${(idx + 1) * 10}s`}
            className={cn(
              "h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              segmentColor(s),
            )}
            style={{ width: `${widthPct}%` }}
            onClick={() => {
              if (safeSegments[idx]) onSelectSegment?.(safeSegments[idx]);
            }}
          />
        );
      })}
    </div>
  );
}

