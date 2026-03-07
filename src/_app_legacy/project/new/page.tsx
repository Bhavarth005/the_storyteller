"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, analyzeVersion, generateCore } from "@/src/lib/api";
import { showApiErrorToast } from "@/src/lib/toast";
import { useVersionStatus } from "@/src/hooks/useVersionStatus";

type InputType = "idea" | "draft";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [inputType, setInputType] = useState<InputType>("idea");
  const [rawStory, setRawStory] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);

  const analyzeVersionMutation = useMutation({
    mutationFn: analyzeVersion,
    onError: (error) => {
      showApiErrorToast(error, {
        title: "Analysis failed",
        onRetry: () => {
          if (!versionId) return;
          analyzeVersionMutation.mutate({ version_id: versionId });
        },
      });
    },
  });

  const generateCoreMutation = useMutation({
    mutationFn: generateCore,
    onError: (error) => {
      showApiErrorToast(error, {
        title: "Generation failed",
        onRetry: () => {
          generateCoreMutation.reset();
        },
      });
    },
    onSuccess: async (data) => {
      setProjectId(data.project_id);
      setVersionId(data.version_id);
      analyzeVersionMutation.mutate({ version_id: data.version_id });
    },
  });

  const statusQuery = useVersionStatus(versionId);

  const helper = useMemo(() => {
    if (inputType === "idea") {
      return "Paste a rough concept, premise, or bullet outline. The engine will expand it into episodes.";
    }
    return "Paste an existing draft. The engine will restructure it into episodic, retention-optimized scripts.";
  }, [inputType]);

  const isBusy =
    generateCoreMutation.isPending ||
    analyzeVersionMutation.isPending ||
    statusQuery.isFetching;

  if (
    projectId &&
    statusQuery.data?.analysis_status === "complete" &&
    !statusQuery.isFetching
  ) {
    router.push(`/project/${projectId}/episode/1`);
  }

  const errorMessage =
    (generateCoreMutation.error as ApiError | null)?.message ??
    (analyzeVersionMutation.error as ApiError | null)?.message ??
    null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft />
              Dashboard
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">New series</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Initialize your engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Series title</Label>
              <Input
                id="title"
                placeholder="e.g., The Neon Detective"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
              />
            </div>

            <Tabs
              value={inputType}
              onValueChange={(v) => setInputType(v as InputType)}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Input type</div>
                  <div className="text-sm text-muted-foreground">{helper}</div>
                </div>
                <TabsList>
                  <TabsTrigger value="idea">Brief idea</TabsTrigger>
                  <TabsTrigger value="draft">Full draft</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="idea" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="raw_story_idea">Your idea</Label>
                  <Textarea
                    id="raw_story_idea"
                    placeholder="Premise, tone, main character, twist…"
                    value={rawStory}
                    onChange={(e) => setRawStory(e.target.value)}
                    className="min-h-40"
                  />
                </div>
              </TabsContent>

              <TabsContent value="draft" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="raw_story_draft">Your draft</Label>
                  <Textarea
                    id="raw_story_draft"
                    placeholder="Paste your draft text here…"
                    value={rawStory}
                    onChange={(e) => setRawStory(e.target.value)}
                    className="min-h-56"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                disabled={!title.trim() || !rawStory.trim() || isBusy}
                onClick={() => {
                  generateCoreMutation.mutate({
                    title: title.trim(),
                    input_type: inputType,
                    raw_story: rawStory.trim(),
                  });
                }}
              >
                {isBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isBusy ? "Generating…" : "Generate engine"}
              </Button>
            </div>
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {versionId ? (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Building your episodic engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>
                      {generateCoreMutation.isSuccess ? "✓" : "↻"}
                    </span>
                    <span>Generating episode scripts…</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {analyzeVersionMutation.isSuccess ? "✓" : "↻"}
                    </span>
                    <span>Extracting character bible…</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {statusQuery.data?.analysis_status === "complete"
                        ? "✓"
                        : "↻"}
                    </span>
                    <span>Running sentiment math & computing retention risks…</span>
                  </div>
                </div>

                <Progress
                  value={
                    statusQuery.data?.analysis_status === "complete"
                      ? 100
                      : analyzeVersionMutation.isSuccess
                        ? 70
                        : generateCoreMutation.isSuccess
                          ? 35
                          : 10
                  }
                />

                <div className="text-xs text-muted-foreground">
                  You can keep this tab open while the AI finishes analysis.
                  Once ready, we&apos;ll drop you into the workspace.
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}

