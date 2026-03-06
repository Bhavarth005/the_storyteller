"use client";

import { useProject } from "@/src/hooks/useProject";
import { WeakestLink } from "@/src/components/series/WeakestLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectOverviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { data, isLoading, isError } = useProject(params.projectId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load project data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {data.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Series overview and performance insights for the active version.
        </p>
      </div>

      <WeakestLink project={data} />
    </div>
  );
}

