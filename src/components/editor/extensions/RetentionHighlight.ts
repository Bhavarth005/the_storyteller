"use client";

import { Mark, mergeAttributes } from "@tiptap/core";

export type RetentionSeverity = "warning" | "risk";

export const RetentionHighlight = Mark.create({
  name: "retentionHighlight",

  addAttributes() {
    return {
      severity: {
        default: "warning" as RetentionSeverity,
        parseHTML: (element) =>
          (element.getAttribute("data-severity") as RetentionSeverity) ??
          "warning",
        renderHTML: (attributes) => ({
          "data-severity": attributes.severity,
        }),
      },
      segmentIndex: {
        default: null as number | null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-segment-index");
          if (!raw) return null;
          const n = Number(raw);
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attributes) => {
          if (attributes.segmentIndex == null) return {};
          return { "data-segment-index": String(attributes.segmentIndex) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark[data-retention-highlight]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const severity = HTMLAttributes.severity as RetentionSeverity | undefined;
    const cls =
      severity === "risk"
        ? "retention-risk"
        : "retention-warning";

    return [
      "mark",
      mergeAttributes(HTMLAttributes, {
        "data-retention-highlight": "true",
        class: cls,
      }),
      0,
    ];
  },
});

