"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { compareVersions, type CompareVersionsResponse } from "@/src/lib/api";

type VersionDiffModalProps = {
  baseVersionId: string;
  targetVersionId: string;
  triggerLabel?: string;
};

export function VersionDiffModal({
  baseVersionId,
  targetVersionId,
  triggerLabel = "Compare versions",
}: VersionDiffModalProps) {
  const { data, isLoading, isError } = useQuery<CompareVersionsResponse>({
    queryKey: ["versions-compare", baseVersionId, targetVersionId],
    queryFn: () => compareVersions(baseVersionId, targetVersionId),
    enabled: Boolean(baseVersionId && targetVersionId),
  });

  const metrics = data?.deltas;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            Version comparison
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-sm text-muted-foreground">
            Loading comparison…
          </div>
        ) : isError || !metrics ? (
          <div className="py-4 text-sm text-destructive">
            Unable to load version comparison.
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Base: {data.base_version_id}</span>
              <span>Target: {data.target_version_id}</span>
            </div>

            <div className="space-y-2">
              <DiffRow
                label="Overall engagement"
                delta={metrics.overall_engagement}
              />
              <DiffRow
                label="Average cliffhanger"
                delta={metrics.average_cliffhanger}
              />
              <DiffRow
                label="Retention stability"
                delta={metrics.retention_stability}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Positive deltas indicate improvement in the target version. Use
              this view in tandem with the radar chart and tension curves to
              explain the impact of AI-driven edits.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DiffRow({ label, delta }: { label: string; delta: string }) {
  const numeric = Number(delta);
  const isPositive = !Number.isNaN(numeric) && numeric > 0;
  const isNegative = !Number.isNaN(numeric) && numeric < 0;

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={
          isPositive
            ? "text-xs font-semibold text-emerald-600"
            : isNegative
              ? "text-xs font-semibold text-red-600"
              : "text-xs font-semibold"
        }
      >
        {delta}
      </span>
    </div>
  );
}

