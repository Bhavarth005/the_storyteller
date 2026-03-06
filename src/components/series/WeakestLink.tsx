import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectDetail } from "@/src/lib/api";

type WeakestLinkProps = {
  project: ProjectDetail;
};

export function WeakestLink({ project }: WeakestLinkProps) {
  const episodes = project.version_data.episodes;

  if (!episodes || episodes.length === 0) {
    return null;
  }

  const withEpisodeScore = episodes.map((ep) => {
    // Prefer a direct engagement score if present; otherwise derive from segments.
    const segmentAvg =
      ep.script_segments.length > 0
        ? ep.script_segments.reduce(
            (sum, seg) => sum + (seg.engagement_score ?? 0),
            0,
          ) / ep.script_segments.length
        : 0;

    return {
      ...ep,
      _engagement: segmentAvg,
    };
  });

  const weakest = withEpisodeScore.reduce((min, current) =>
    current._engagement < min._engagement ? current : min,
  );

  return (
    <Card className="border-amber-300/60 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-amber-900 dark:text-amber-100">
          Weakest link detected
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Episode {weakest.episode_number}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-amber-900 dark:text-amber-50">
          <span className="font-medium">
            {weakest.title || `Episode ${weakest.episode_number}`}
          </span>{" "}
          currently has the lowest engagement score in this version.
        </p>
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80">
          Based on the average engagement of its sentiment segments.
          Consider tightening pacing or increasing emotional variance.
        </p>
        <div className="pt-1">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-900 dark:border-amber-600 dark:text-amber-50"
          >
            <Link
              href={`/project/${project.id}/episode/${weakest.episode_number}`}
            >
              Edit Episode {weakest.episode_number}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

