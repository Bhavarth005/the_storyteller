"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
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

type OptimizationSuggestion = {
  segment_index?: number | null;
  target_time_sec?: number | null;
  /** AI-generated explanation of WHY this segment risks drop-off. */
  reason?: string;
  /** Seed-data field — same semantic as reason. */
  issue?: string;
  suggestion: string;
  priority?: string;
};

type ActiveSegment = ScriptSegment & {
  severity: RetentionSeverity;
  segmentIndex: number;
};

function segmentSeverity(segment: ScriptSegment): RetentionSeverity | null {
  if (segment.drop_probability > 0.7) return "risk";
  if (segment.drop_probability > 0.4) return "warning";
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
  optimizationSuggestions?: OptimizationSuggestion[];
  explanation?: {
    retention_risk_reason?: string;
    optimization_rationale?: string;
  };
  onApplyAiFix?: (segment: ScriptSegment | null) => void;
  isApplyingAiFix?: boolean;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, RetentionHighlight],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-64 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !segments || segments.length === 0) return;

    // Build a flat text string and a parallel array mapping each character
    // index back to its ProseMirror document position.
    //
    // A synthetic space is inserted wherever there is a position gap between
    // consecutive text nodes — which always indicates a block boundary (e.g.
    // between two <p> tags).  This mirrors the single-space join that
    // buildWordChunks uses when splitting the plain-text script, so indexOf
    // finds exact matches even in multi-paragraph documents.
    let docText = "";
    const charToDocPos: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        if (charToDocPos.length > 0) {
          const prevPos = charToDocPos[charToDocPos.length - 1];
          if (pos > prevPos + 1) {
            // Gap between text nodes = block boundary: insert a normalising space.
            docText += " ";
            charToDocPos.push(pos);
          }
        }
        for (let i = 0; i < node.text.length; i++) {
          docText += node.text[i];
          charToDocPos.push(pos + i);
        }
      }
    });

    const docSize = editor.state.doc.content.size;

    // Clear all existing highlights.
    editor
      .chain()
      .setTextSelection({ from: 1, to: docSize })
      .unsetMark("retentionHighlight")
      .run();

    let cursor = 0;
    for (const [segmentIndex, seg] of segments.entries()) {
      // Normalise whitespace in the stored segment text — this handles any
      // HTML-stripped whitespace artefacts from earlier analysis runs.
      const segText = seg.text.replace(/\s+/g, " ").trim();
      const idx = docText.indexOf(segText, cursor);

      // Always advance cursor to maintain ordering, even for non-highlighted segs.
      if (idx >= 0) cursor = idx + segText.length;

      const sev = segmentSeverity(seg);
      if (!sev || idx < 0) continue;

      const from = charToDocPos[idx];
      const lastIdx = idx + segText.length - 1;
      const to = (charToDocPos[lastIdx] ?? charToDocPos[charToDocPos.length - 1]) + 1;
      if (from == null || from < 1) continue;

      editor
        .chain()
        .setTextSelection({ from, to })
        .setMark("retentionHighlight", { severity: sev, segmentIndex })
        .run();
    }

    // Deselect — move cursor to document end.
    editor.commands.setTextSelection(docSize);
  }, [editor, segments]);

  // ── Active segment + tooltip state ──────────────────────────────────────
  // NOTE: activeSegment is driven by selection events, not useMemo, so that
  // it updates whenever the user moves the cursor to a different highlight.
  const [activeSegment, setActiveSegment] = useState<ActiveSegment | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const updateTooltipState = useCallback(() => {
    if (!editor || !editorWrapperRef.current) {
      setShowTooltip(false);
      return;
    }
    if (!editor.isActive("retentionHighlight")) {
      setShowTooltip(false);
      setActiveSegment(null);
      return;
    }
    const { view } = editor;
    const { from, to } = view.state.selection;
    // Only show for a plain cursor (no text-range selection active).
    if (from !== to) {
      setShowTooltip(false);
      return;
    }
    // Resolve segment from mark attributes at cursor position.
    const attrs = editor.getAttributes("retentionHighlight") as {
      severity?: RetentionSeverity;
      segmentIndex?: number | null;
    };
    if (attrs.segmentIndex != null && segments) {
      const seg = segments[attrs.segmentIndex];
      if (seg) {
        setActiveSegment({
          ...seg,
          severity: attrs.severity ?? segmentSeverity(seg) ?? "warning",
          segmentIndex: attrs.segmentIndex,
        });
      }
    }
    const coords = view.coordsAtPos(from);
    const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
    setTooltipPos({
      top: coords.top - wrapperRect.top - 8,
      left: coords.left - wrapperRect.left,
    });
    setShowTooltip(true);
  }, [editor, segments]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updateTooltipState);
    editor.on("transaction", updateTooltipState);
    return () => {
      editor.off("selectionUpdate", updateTooltipState);
      editor.off("transaction", updateTooltipState);
    };
  }, [editor, updateTooltipState]);

  // ── Find matching optimization suggestion for the active segment ─────────
  const activeSuggestion = useMemo(() => {
    if (!activeSegment || !optimizationSuggestions) return null;
    return (
      optimizationSuggestions.find(
        (s) =>
          s.segment_index === activeSegment.segmentIndex ||
          (s.target_time_sec != null &&
            s.target_time_sec >= activeSegment.start_sec &&
            s.target_time_sec < activeSegment.end_sec),
      ) ?? null
    );
  }, [activeSegment, optimizationSuggestions]);

  const reasonText = activeSegment
    ? (activeSuggestion?.reason ??
        activeSuggestion?.issue ??
        (activeSegment.severity === "risk"
          ? `Drop probability ${Math.round(activeSegment.drop_probability * 100)}% — sustained ${activeSegment.emotion} emotion at low intensity signals viewer disengagement.`
          : `Emotional flatline risk — ${activeSegment.emotion} tone may not hold audience attention through this segment.`))
    : null;

  return (
    <div ref={editorWrapperRef} className={cn("relative", className)}>
      {/* Floating tooltip */}
      {showTooltip && activeSegment && tooltipPos && (
        <div
          className="absolute z-50"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: "translate(-50%, -100%)" }}
        >
          <Card className="w-[min(420px,calc(100vw-2rem))] shadow-lg">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {activeSegment.severity === "risk" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Info className="h-4 w-4 text-yellow-600" />
                )}
                Retention insight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4 text-sm">
              {/* Stats row */}
              <div className="space-y-1 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Window:</span>{" "}
                  {activeSegment.start_sec}s–{activeSegment.end_sec}s •{" "}
                  <span className="font-medium text-foreground">Drop:</span>{" "}
                  {Math.round(activeSegment.drop_probability * 100)}%
                </div>
                <div>
                  <span className="font-medium text-foreground">Emotion:</span>{" "}
                  {activeSegment.emotion}
                </div>
              </div>

              {/* Per-segment reason */}
              <div>
                <div className="mb-1 font-medium text-foreground">Why</div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                  {reasonText}
                </div>
              </div>

              {/* Per-segment improvement suggestion */}
              {activeSuggestion?.suggestion ? (
                <div>
                  <div className="mb-1 font-medium text-foreground">Fix</div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                    {activeSuggestion.suggestion}
                  </div>
                </div>
              ) : explanation?.optimization_rationale ? (
                <div>
                  <div className="mb-1 font-medium text-foreground">Suggestion</div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                    {explanation.optimization_rationale}
                  </div>
                </div>
              ) : null}

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
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

