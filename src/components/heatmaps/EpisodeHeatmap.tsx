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
  segments: ScriptSegment[];
  className?: string;
  onSelectSegment?: (segment: ScriptSegment) => void;
}) {
  const total = segments.reduce(
    (sum, s) => sum + Math.max(0, s.end_sec - s.start_sec),
    0,
  );

  return (
    <div
      className={cn(
        "flex h-3 w-full overflow-hidden rounded-md border bg-muted/30",
        className,
      )}
      role="list"
      aria-label="Episode retention heatmap"
    >
      {segments.map((s, idx) => {
        const duration = Math.max(0, s.end_sec - s.start_sec);
        const widthPct = total > 0 ? (duration / total) * 100 : 0;

        return (
          <button
            key={`${s.start_sec}-${s.end_sec}-${idx}`}
            type="button"
            role="listitem"
            aria-label={`Segment ${s.start_sec}-${s.end_sec}s`}
            className={cn(
              "h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              segmentColor(s),
            )}
            style={{ width: `${widthPct}%` }}
            onClick={() => onSelectSegment?.(s)}
          />
        );
      })}
    </div>
  );
}

