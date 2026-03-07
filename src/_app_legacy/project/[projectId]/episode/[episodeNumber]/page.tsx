import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodeEditorPage({
  params,
}: {
  params: { projectId: string; episodeNumber: string };
}) {
  const episodeNumber = Number(params.episodeNumber);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          Episode {Number.isFinite(episodeNumber) ? episodeNumber : params.episodeNumber}
        </h2>
        <p className="text-sm text-muted-foreground">
          Script editor, heatmap, and inline retention highlights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Episode timeline heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <div className="mt-2 text-sm text-muted-foreground">
            Segments will render here (green/yellow/red).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Script editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-10/12" />
          <Skeleton className="h-6 w-9/12" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-8/12" />
          <div className="pt-2 text-sm text-muted-foreground">
            Tiptap editor will be mounted here in Phase 5.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

