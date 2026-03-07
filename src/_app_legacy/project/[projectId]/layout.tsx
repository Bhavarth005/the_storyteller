import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">Project</div>
            <div className="truncate text-lg font-semibold">
              {params.projectId}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/project/${params.projectId}/episode/1`}>
                Open Episode 1
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="lg:sticky lg:top-6 lg:h-[calc(100dvh-7.5rem)]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Continuity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-4/5" />
                <div className="pt-2 text-sm text-muted-foreground">
                  Character bible and world state will appear here.
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0">{children}</section>

          <aside className="lg:sticky lg:top-6 lg:h-[calc(100dvh-7.5rem)]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="pt-2 text-sm text-muted-foreground">
                  Tension curve, radar metrics, and explanations will appear
                  here.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

