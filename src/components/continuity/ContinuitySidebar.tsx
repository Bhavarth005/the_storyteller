"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type ContinuityCharacter = {
  name: string;
  description: string;
  traits: string[];
};

export function ContinuitySidebar({
  characters,
  isLoading,
}: {
  characters: ContinuityCharacter[] | undefined;
  isLoading?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Continuity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : characters && characters.length > 0 ? (
          <div className="space-y-3">
            {characters.map((c) => (
              <div key={c.name} className="rounded-lg border p-3">
                <div className="font-medium leading-5">{c.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {c.description}
                </div>
                {c.traits.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.traits.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No character continuity data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

