import { z } from "zod/v4";

// ─── Zod Schemas: AI JSON Contracts ──────────────────────────────────────────

// Agent 0: Story Arc Planner output
export const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  traits: z.array(z.string()),
});

export const EpisodeGoalSchema = z.object({
  episode_number: z.number().int().positive(),
  narrative_goal: z.string(),
});

export const StoryArcSchema = z.object({
  global_characters: z.array(CharacterSchema).min(1),
  episode_goals: z.array(EpisodeGoalSchema).min(1),
});

// Agent 1: Narrative Architect output
export const ContinuityFactSchema = z.object({
  fact: z.string(),
  known_by: z.array(z.string()),
  unknown_by: z.array(z.string()),
});

export const RelationshipSchema = z.object({
  entities: z.array(z.string()).min(2),
  dynamic: z.string(),
});

export const ContinuityLedgerSchema = z.object({
  information_state: z.array(ContinuityFactSchema),
  relationship_state: z.array(RelationshipSchema),
});

export const EpisodeGenerationSchema = z.object({
  script_content: z.string().min(1),
  continuity_ledger: ContinuityLedgerSchema,
});

// Model 1: NLP Sentiment Analysis output (per segment)
export const SentimentSegmentSchema = z.object({
  emotion: z.string(),
  intensity: z.number().min(0).max(1),
});

export const SentimentAnalysisSchema = z.object({
  segments: z.array(
    z.object({
      start_sec: z.number().int().min(0),
      end_sec: z.number().int().positive(),
      text: z.string(),
      emotion: z.string(),
      emotion_intensity: z.number().min(0).max(1),
    })
  ).min(1),
});

// Agent 2: Hook & Cliffhanger Evaluator output
export const HookCliffhangerSchema = z.object({
  hook: z.object({
    pattern: z.string(),
    novelty_score: z.number().min(0).max(1),
  }),
  cliffhanger: z.object({
    open_loops: z.number().int().min(0),
    threat_level: z.number().min(0).max(1),
    logic: z.string(),
  }),
});

// Agent 3: Optimization Critic output
export const OptimizationIssueSchema = z.object({
  type: z.string(),
  target_time_sec: z.number().int().min(0),
  severity: z.enum(["low", "medium", "high"]),
});

export const OptimizationSuggestionSchema = z.object({
  target_time_sec: z.number().int().min(0),
  suggestion: z.string(),
});

export const OptimizationCriticSchema = z.object({
  issues: z.array(OptimizationIssueSchema),
  optimization_suggestions: z.array(OptimizationSuggestionSchema),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type StoryArc = z.infer<typeof StoryArcSchema>;
export type EpisodeGeneration = z.infer<typeof EpisodeGenerationSchema>;
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;
export type HookCliffhanger = z.infer<typeof HookCliffhangerSchema>;
export type OptimizationCritic = z.infer<typeof OptimizationCriticSchema>;
export type ContinuityLedger = z.infer<typeof ContinuityLedgerSchema>;

// ─── Placeholder: Agent 0 — Story Arc Planner ───────────────────────────────

/**
 * Generates global characters and episode goals from a story premise.
 * TODO: Replace with Heavy LLM call (gpt-4o / gemini-1.5-pro).
 */
export async function generateStoryArc(
  title: string,
  rawStory: string
): Promise<StoryArc> {
  const result: StoryArc = {
    global_characters: [
      { name: "Protagonist", description: `The lead character of "${title}"`, traits: ["determined", "resourceful"] },
      { name: "Antagonist", description: "The primary opposing force", traits: ["cunning", "powerful"] },
      { name: "Ally", description: "A key supporting character", traits: ["loyal", "skilled"] },
    ],
    episode_goals: Array.from({ length: 8 }, (_, i) => ({
      episode_number: i + 1,
      narrative_goal: [
        "Introduce the primary mystery and main character",
        "Escalate the physical threat and introduce an ally",
        "Reveal a critical piece of hidden information",
        "A betrayal fractures the protagonist's trust",
        "The protagonist discovers the antagonist's true plan",
        "A direct confrontation forces a difficult choice",
        "The stakes reach their peak with a devastating setback",
        "The final resolution with lasting consequences",
      ][i],
    })),
  };

  StoryArcSchema.parse(result);
  return result;
}

// ─── Placeholder: Agent 1 — Narrative Architect ─────────────────────────────

/**
 * Generates a single episode script and its continuity ledger.
 * TODO: Replace with Heavy LLM call that receives previous ledger for state continuity.
 */
export async function generateEpisodeScript(
  episodeGoal: string,
  episodeNumber: number,
  previousLedger: ContinuityLedger | null
): Promise<EpisodeGeneration> {
  const result: EpisodeGeneration = {
    script_content: `EPISODE ${episodeNumber}: ${episodeGoal}. The scene opens with rising tension. Characters navigate a complex situation driven by hidden motives and mounting pressure. A critical discovery changes everything. The episode ends with an unresolved threat that propels the narrative forward. [Placeholder — ~150 words of generated script content will appear here when connected to the LLM.]`,
    continuity_ledger: {
      information_state: [
        { fact: `Key event from episode ${episodeNumber} occurred`, known_by: ["Protagonist"], unknown_by: ["Antagonist"] },
      ],
      relationship_state: [
        { entities: ["Protagonist", "Ally"], dynamic: episodeNumber <= 4 ? "Building trust" : "Tested under pressure" },
      ],
    },
  };

  EpisodeGenerationSchema.parse(result);
  return result;
}

// ─── Placeholder: Model 1 — Sentiment Analysis (NLP) ────────────────────────

/**
 * Analyzes script content and returns emotion + intensity for each 10-sec segment.
 * TODO: Replace with roberta-base-go_emotions API call.
 */
export async function analyzeEpisodeSentiment(
  scriptContent: string
): Promise<SentimentAnalysis> {
  const sentences = scriptContent.match(/[^.!?]+[.!?]+/g) || [scriptContent];
  const segmentCount = Math.min(9, Math.max(3, Math.ceil(sentences.length / 2)));

  const emotions = ["neutral", "fear", "surprise", "curiosity", "tension", "anger", "sadness", "excitement", "anticipation"];

  const segments = Array.from({ length: segmentCount }, (_, i) => {
    const chunkSentences = sentences.slice(i * 2, i * 2 + 2);
    // Generate a realistic intensity curve: starts moderate, dips mid, spikes at end
    const position = i / (segmentCount - 1 || 1);
    const baseIntensity = 0.4 + 0.3 * Math.sin(position * Math.PI) + position * 0.2;
    const intensity = parseFloat(Math.min(1, Math.max(0, baseIntensity + (Math.random() * 0.1 - 0.05))).toFixed(2));

    return {
      start_sec: i * 10,
      end_sec: (i + 1) * 10,
      text: chunkSentences.join(" ").trim() || `[Segment ${i + 1}]`,
      emotion: emotions[i % emotions.length],
      emotion_intensity: intensity,
    };
  });

  const result: SentimentAnalysis = { segments };

  SentimentAnalysisSchema.parse(result);
  return result;
}

// ─── Placeholder: Agent 2 — Hook & Cliffhanger Evaluator ────────────────────

/**
 * Evaluates the hook strength and cliffhanger power of a script.
 * TODO: Replace with Fast LLM call (gpt-4o-mini / gemini-1.5-flash).
 */
export async function evaluateEpisodeHooks(
  scriptContent: string
): Promise<HookCliffhanger> {
  const wordCount = scriptContent.split(/\s+/).length;
  const hookScore = parseFloat(Math.min(1, 0.5 + wordCount * 0.002).toFixed(2));
  const threatLevel = parseFloat(Math.min(1, 0.4 + wordCount * 0.003).toFixed(2));

  const result: HookCliffhanger = {
    hook: {
      pattern: "curiosity_gap",
      novelty_score: hookScore,
    },
    cliffhanger: {
      open_loops: Math.min(5, Math.max(1, Math.floor(wordCount / 30))),
      threat_level: threatLevel,
      logic: "Unresolved narrative threads create viewer anticipation. The final scene introduces a new visual stake that raises immediate questions.",
    },
  };

  HookCliffhangerSchema.parse(result);
  return result;
}

// ─── Placeholder: Agent 3 — Optimization Critic ─────────────────────────────

/**
 * Analyzes segments for low-engagement zones and suggests improvements.
 * TODO: Replace with Heavy LLM call, triggered only when drop_probability > 0.6 or cliffhanger_score < 5.
 */
export async function suggestOptimizations(
  segments: SentimentAnalysis["segments"]
): Promise<OptimizationCritic> {
  const issues: OptimizationCritic["issues"] = [];
  const suggestions: OptimizationCritic["optimization_suggestions"] = [];

  for (const seg of segments) {
    if (seg.emotion_intensity < 0.35) {
      issues.push({
        type: "low_tension",
        target_time_sec: seg.start_sec,
        severity: seg.emotion_intensity < 0.2 ? "high" : "medium",
      });
      suggestions.push({
        target_time_sec: seg.start_sec,
        suggestion: `Emotional intensity at ${seg.start_sec}s is ${seg.emotion_intensity}. Consider inserting a visual reveal or character conflict to break the flatline.`,
      });
    }
  }

  // Always return at least one suggestion for demo purposes
  if (suggestions.length === 0) {
    suggestions.push({
      target_time_sec: segments[segments.length - 1]?.start_sec ?? 0,
      suggestion: "Pacing is strong. Consider amplifying the final cliffhanger with a time-pressure element.",
    });
  }

  const result: OptimizationCritic = { issues, optimization_suggestions: suggestions };

  OptimizationCriticSchema.parse(result);
  return result;
}
