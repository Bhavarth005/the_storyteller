"use client";

import { useEffect, useMemo } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AlertTriangle, Info, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  RetentionHighlight,
  type RetentionSeverity,
} from "@/src/components/editor/extensions/RetentionHighlight";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScriptSegment = {
  start_sec: number;
  end_sec: number;
  text: string;
  emotion: string;
  drop_probability: number;
};

function segmentSeverity(segment: ScriptSegment): RetentionSeverity | null {
  const duration = Math.max(0, segment.end_sec - segment.start_sec);
  if (segment.drop_probability > 0.7) return "risk";
  if (segment.emotion === "neutral" && duration >= 15) return "warning";
  return null;
}

export function ScriptEditor({
  content,
  onChange,
  segments,
  optimizationSuggestions,
  explanation,
  onApplyAiFix,
  isApplyingAiFix,
  className,
}: {
  content: string;
  onChange?: (nextContent: string) => void;
  segments?: ScriptSegment[];
  optimizationSuggestions?: string[];
  explanation?: {
    retention_risk_reason?: string;
    optimization_rationale?: string;
  };
  onApplyAiFix?: (segment: ScriptSegment | null) => void;
  isApplyingAiFix?: boolean;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, RetentionHighlight],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-64 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current === content) return;
    editor.commands.setContent(content, false);
  }, [content, editor]);

  useEffect(() => {
    if (!editor || !segments || segments.length === 0) return;

    const docText = editor.getText();
    const docEnd = editor.state.doc.content.size + 1;
    let cursor = 0;

    editor
      .chain()
      .setTextSelection({ from: 1, to: docEnd })
      .unsetMark("retentionHighlight")
      .run();

    for (const [segmentIndex, seg] of segments.entries()) {
      const sev = segmentSeverity(seg);
      if (!sev) continue;
      const idx = docText.indexOf(seg.text, cursor);
      if (idx < 0) continue;

      const from = idx + 1;
      const to = idx + seg.text.length + 1;

      editor
        .chain()
        .setTextSelection({ from, to })
        .setMark("retentionHighlight", { severity: sev, segmentIndex })
        .run();
      cursor = idx + seg.text.length;
    }

    editor.commands.setTextSelection(docEnd);
  }, [editor, segments]);

  const activeSegment = useMemo(() => {
    if (!editor || !segments) return null;
    const attrs = editor.getAttributes("retentionHighlight") as {
      severity?: RetentionSeverity;
      segmentIndex?: number | null;
    };
    if (attrs.segmentIndex == null) return null;
    const seg = segments[attrs.segmentIndex];
    if (!seg) return null;
    return { ...seg, severity: attrs.severity ?? segmentSeverity(seg) ?? "warning", segmentIndex: attrs.segmentIndex };
  }, [editor, segments]);

  return (
    <div className={cn("relative", className)}>
      {editor ? (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor }) => editor.isActive("retentionHighlight")}
          tippyOptions={{ duration: 0, maxWidth: 420 }}
        >
          <Card className="w-[min(420px,calc(100vw-2rem))] shadow-lg">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {activeSegment?.severity === "risk" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Info className="h-4 w-4 text-yellow-600" />
                )}
                Retention insight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4 text-sm">
              {activeSegment ? (
                <div className="space-y-1 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Window:</span>{" "}
                    {activeSegment.start_sec}s–{activeSegment.end_sec}s •{" "}
                    <span className="font-medium text-foreground">Drop:</span>{" "}
                    {Math.round(activeSegment.drop_probability * 100)}%
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Signal:</span>{" "}
                    {activeSegment.severity === "risk"
                      ? "High drop risk"
                      : "Possible flatline"}
                    {" • "}
                    <span className="font-medium text-foreground">Emotion:</span>{" "}
                    {activeSegment.emotion}
                  </div>
                </div>
              ) : null}

              {explanation?.retention_risk_reason ? (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                  {explanation.retention_risk_reason}
                </div>
              ) : null}

              {optimizationSuggestions && optimizationSuggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="font-medium">Suggestions</div>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {optimizationSuggestions.map((s, i) => (
                      <li key={`${i}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : explanation?.optimization_rationale ? (
                <div className="space-y-1">
                  <div className="font-medium">Suggestion</div>
                  <div className="text-muted-foreground">
                    {explanation.optimization_rationale}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No suggestions available yet for this segment.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!onApplyAiFix || isApplyingAiFix}
                  onClick={() => onApplyAiFix?.(activeSegment)}
                >
                  <Sparkles className={isApplyingAiFix ? "animate-spin" : ""} />
                  {isApplyingAiFix ? "Applying…" : "Apply AI Fix"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </BubbleMenu>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

