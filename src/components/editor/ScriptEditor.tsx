"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AlertTriangle, Info, Sparkles, X } from "lucide-react";

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
  reason?: string;
  issue?: string;
  suggestion: string;
  priority?: string;
};

type HoverState = {
  segment: ScriptSegment;
  segmentIndex: number;
  severity: RetentionSeverity;
  reason: string | null;
  suggestion: string | null;
  anchorTop: number;
  anchorLeft: number;
};

function segmentSeverity(segment: ScriptSegment): RetentionSeverity | null {
  if (segment.drop_probability > 0.7) return "risk";
  if (segment.drop_probability > 0.4) return "warning";
  return null;
}

function normalizeTextForMatching(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildNormalizedDocTextMap(editor: NonNullable<ReturnType<typeof useEditor>>) {
  let normalizedText = "";
  const normalizedIndexToDocPos: number[] = [];
  let previousWasSpace = true;

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    for (let i = 0; i < node.text.length; i++) {
      const char = node.text[i];
      const isSpace = /\s/.test(char);
      if (isSpace) {
        if (previousWasSpace) continue;
        normalizedText += " ";
        normalizedIndexToDocPos.push(pos + i);
        previousWasSpace = true;
        continue;
      }

      normalizedText += char;
      normalizedIndexToDocPos.push(pos + i);
      previousWasSpace = false;
    }

    if (!previousWasSpace) {
      normalizedText += " ";
      normalizedIndexToDocPos.push(pos + node.text.length - 1);
      previousWasSpace = true;
    }
  });

  normalizedText = normalizedText.trimEnd();
  if (normalizedIndexToDocPos.length > normalizedText.length) {
    normalizedIndexToDocPos.splice(normalizedText.length);
  }

  return { normalizedText, normalizedIndexToDocPos };
}

function findSegmentTextMatchIndex(
  normalizedDoc: string,
  normalizedSegmentText: string,
  predictedStart: number,
): number {
  if (!normalizedSegmentText) return -1;

  const docLength = normalizedDoc.length;
  const windowRadius = Math.max(120, Math.floor(docLength * 0.08));
  const windowStart = Math.max(0, predictedStart - windowRadius);
  const windowEnd = Math.min(docLength, predictedStart + windowRadius);

  const windowText = normalizedDoc.slice(windowStart, windowEnd);
  const localIndex = windowText.indexOf(normalizedSegmentText);
  if (localIndex >= 0) return windowStart + localIndex;

  return normalizedDoc.indexOf(normalizedSegmentText);
}

function computeWordChunkRanges(
  normalizedText: string,
  normalizedIndexToDocPos: number[],
  segmentCount: number,
): Array<{ fromDocPos: number; toDocPos: number }> {
  const textLen = normalizedText.length;
  if (textLen === 0 || segmentCount === 0) return [];

  const chunkSize = textLen / segmentCount;
  const ranges: Array<{ fromDocPos: number; toDocPos: number }> = [];

  for (let i = 0; i < segmentCount; i++) {
    const startIdx = Math.round(i * chunkSize);
    const endIdx = Math.round((i + 1) * chunkSize);

    let adjStart = startIdx;
    while (adjStart > 0 && normalizedText[adjStart - 1] !== " ") adjStart--;
    let adjEnd = endIdx;
    while (adjEnd < textLen && normalizedText[adjEnd] !== " ") adjEnd++;

    const from = normalizedIndexToDocPos[Math.max(0, adjStart)];
    const to = normalizedIndexToDocPos[Math.max(0, Math.min(textLen - 1, adjEnd - 1))];

    if (from != null && to != null) {
      ranges.push({ fromDocPos: from, toDocPos: to + 1 });
    }
  }

  return ranges;
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

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverTooltipRef = useRef(false);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  const suggestionsBySegment = useMemo(() => {
    const map = new Map<number, OptimizationSuggestion>();
    for (const item of optimizationSuggestions ?? []) {
      if (item.segment_index == null || !Number.isInteger(item.segment_index)) continue;
      if (!map.has(item.segment_index)) map.set(item.segment_index, item);
    }
    return map;
  }, [optimizationSuggestions]);

  useEffect(() => {
    if (!editor || !segments || segments.length === 0) return;

    const markType = editor.state.schema.marks.retentionHighlight;
    if (!markType) return;

    const { normalizedText, normalizedIndexToDocPos } = buildNormalizedDocTextMap(editor);
    const docLength = normalizedText.length;
    if (docLength === 0 || normalizedIndexToDocPos.length === 0) return;

    const wordChunkRanges = computeWordChunkRanges(normalizedText, normalizedIndexToDocPos, segments.length);

    let tr = editor.state.tr.removeMark(1, editor.state.doc.content.size, markType);

    for (const [segmentIndex, seg] of segments.entries()) {
      const severity = segmentSeverity(seg);
      if (!severity) continue;

      const normalizedSegmentText = normalizeTextForMatching(seg.text);
      const chunkHint = wordChunkRanges[segmentIndex];
      const hintStartIdx = chunkHint
        ? normalizedIndexToDocPos.indexOf(chunkHint.fromDocPos)
        : 0;
      const matchedStart = findSegmentTextMatchIndex(
        normalizedText,
        normalizedSegmentText,
        Math.max(0, hintStartIdx),
      );

      let from: number;
      let to: number;

      if (matchedStart >= 0) {
        const endIdx = Math.min(docLength, matchedStart + Math.max(1, normalizedSegmentText.length));
        const fromDoc = normalizedIndexToDocPos[matchedStart];
        const toDoc = normalizedIndexToDocPos[Math.min(docLength - 1, endIdx - 1)];
        if (fromDoc == null || toDoc == null) continue;
        from = Math.max(1, fromDoc);
        to = Math.max(from + 1, toDoc + 1);
      } else if (chunkHint) {
        from = Math.max(1, chunkHint.fromDocPos);
        to = Math.max(from + 1, chunkHint.toDocPos);
      } else {
        continue;
      }

      const suggestion = suggestionsBySegment.get(segmentIndex);
      const reason =
        suggestion?.reason ??
        suggestion?.issue ??
        (severity === "risk"
          ? `Drop probability ${Math.round(seg.drop_probability * 100)}% in ${seg.start_sec}s-${seg.end_sec}s.`
          : `Moderate retention risk in ${seg.start_sec}s-${seg.end_sec}s due to low emotional variance.`);
      const suggestionText = suggestion?.suggestion ?? explanation?.optimization_rationale ?? null;

      tr = tr.addMark(
        from,
        to,
        markType.create({
          severity,
          segmentIndex,
          reason,
          suggestion: suggestionText,
        }),
      );
    }

    editor.view.dispatch(tr);
    setHoverState(null);
  }, [editor, segments, suggestionsBySegment, explanation?.optimization_rationale]);

  const scheduleClose = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      if (!isOverTooltipRef.current) setHoverState(null);
    }, 200);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!segments || segments.length === 0 || !wrapperRef.current) {
        scheduleClose();
        return;
      }

      const target = event.target as HTMLElement | null;
      const mark = target?.closest("mark[data-retention-highlight]") as HTMLElement | null;
      if (!mark) {
        scheduleClose();
        return;
      }

      cancelClose();

      const segmentIndex = Number(mark.dataset.segmentIndex);
      if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex >= segments.length) {
        scheduleClose();
        return;
      }

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      const anchorLeft = markRect.left + markRect.width / 2 - wrapperRect.left;
      const anchorTop = markRect.top - wrapperRect.top;

      setHoverState((prev) => {
        if (prev?.segmentIndex === segmentIndex) return prev;
        return {
          segment: segments[segmentIndex],
          segmentIndex,
          severity: (mark.dataset.severity as RetentionSeverity) ?? segmentSeverity(segments[segmentIndex]) ?? "warning",
          reason: mark.dataset.reason ?? null,
          suggestion: mark.dataset.suggestion ?? null,
          anchorTop,
          anchorLeft,
        };
      });
    },
    [segments, scheduleClose, cancelClose],
  );

  useEffect(() => {
    if (!hoverState) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (tooltipRef.current?.contains(target)) return;
      if (
        wrapperRef.current?.contains(target) &&
        (event.target as HTMLElement)?.closest("mark[data-retention-highlight]")
      ) {
        return;
      }
      setHoverState(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [hoverState]);

  const hoveredSuggestion = useMemo(() => {
    if (!hoverState) return null;
    return (
      suggestionsBySegment.get(hoverState.segmentIndex) ??
      optimizationSuggestions?.find(
        (s) =>
          s.target_time_sec != null &&
          s.target_time_sec >= hoverState.segment.start_sec &&
          s.target_time_sec < hoverState.segment.end_sec,
      ) ??
      null
    );
  }, [hoverState, optimizationSuggestions, suggestionsBySegment]);

  const reasonText =
    hoverState?.reason ??
    hoveredSuggestion?.reason ??
    hoveredSuggestion?.issue ??
    explanation?.retention_risk_reason ??
    null;

  const suggestionText =
    hoverState?.suggestion ??
    hoveredSuggestion?.suggestion ??
    explanation?.optimization_rationale ??
    null;

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isOverTooltipRef.current) scheduleClose();
      }}
    >
      {hoverState && (
        <div
          className="absolute z-50"
          style={{
            top: hoverState.anchorTop - 8,
            left: hoverState.anchorLeft,
            transform: "translate(-50%, -100%)",
          }}
          onMouseEnter={() => {
            isOverTooltipRef.current = true;
            cancelClose();
          }}
          onMouseLeave={() => {
            isOverTooltipRef.current = false;
            scheduleClose();
          }}
        >
          <Card ref={tooltipRef} className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] shadow-lg">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  {hoverState.severity === "risk" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Info className="h-4 w-4 text-yellow-600" />
                  )}
                  Retention insight
                </span>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setHoverState(null)}
                  aria-label="Close insight"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] space-y-3 overflow-y-auto pb-4 pr-1 text-sm">
              <div className="space-y-1 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Window:</span>{" "}
                  {hoverState.segment.start_sec}s-{hoverState.segment.end_sec}s <span className="font-medium text-foreground">Drop:</span>{" "}
                  {Math.round(hoverState.segment.drop_probability * 100)}%
                </div>
                <div>
                  <span className="font-medium text-foreground">Emotion:</span>{" "}
                  {hoverState.segment.emotion}
                </div>
              </div>

              {reasonText ? (
                <div>
                  <div className="mb-1 font-medium text-foreground">Why</div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                    {reasonText}
                  </div>
                </div>
              ) : null}

              {suggestionText ? (
                <div>
                  <div className="mb-1 font-medium text-foreground">Fix</div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                    {suggestionText}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!onApplyAiFix || isApplyingAiFix}
                  onClick={() => onApplyAiFix?.(hoverState.segment)}
                >
                  <Sparkles className={isApplyingAiFix ? "animate-spin" : ""} />
                  {isApplyingAiFix ? "Applying..." : "Apply AI Fix"}
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
