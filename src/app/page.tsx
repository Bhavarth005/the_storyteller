import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProjectSummary = {
  id: string;
  title: string;
  input_type: "idea" | "draft";
  updated_at: string;
};

const projects: ProjectSummary[] = [];

export default function DashboardPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">
              Episodic Intelligence Engine
            </h1>
            <p className="text-sm text-muted-foreground">
              Create, analyze, and iterate on 90-second episodic scripts.
            </p>
          </div>
          <Button asChild>
            <Link href="/project/new">
              <Plus />
              New series
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {projects.length === 0 ? (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Create your first series</CardTitle>
              <CardDescription>
                Start from a brief idea or paste a full draft. We’ll generate
                episodes and highlight retention risks.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                No projects yet.
              </p>
              <Button asChild>
                <Link href="/project/new">
                  <Plus />
                  New series
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id} className="hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="truncate">{p.title}</CardTitle>
                  <CardDescription className="capitalize">
                    {p.input_type} • Updated {new Date(p.updated_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" asChild className="w-full">
                    <Link href={`/project/${p.id}`}>Open workspace</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

