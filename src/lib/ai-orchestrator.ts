import { generateObject } from "ai";
import { z } from "zod/v4";
import { fastModel, heavyModel } from "./ai-clients";

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

const WORDS_PER_SENTIMENT_CHUNK = 25;

function buildWordChunks(text: string, wordsPerChunk: number = WORDS_PER_SENTIMENT_CHUNK) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [
      {
        text: "",
        start_sec: 0,
        end_sec: 10,
      },
    ];
  }

  const chunks: Array<{ text: string; start_sec: number; end_sec: number }> = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunkIndex = chunks.length;
    chunks.push({
      text: words.slice(i, i + wordsPerChunk).join(" "),
      start_sec: chunkIndex * 10,
      end_sec: (chunkIndex + 1) * 10,
    });
  }
  return chunks;
}

function takeWords(text: string, count: number, fromEnd: boolean = false) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (fromEnd) {
    return words.slice(Math.max(words.length - count, 0)).join(" ");
  }
  return words.slice(0, count).join(" ");
}

// ─── Placeholder: Agent 0 — Story Arc Planner ───────────────────────────────

export async function generateStoryArc(
  title: string,
  rawStory: string,
  episodeCount: number = 8
): Promise<StoryArc> {
  const { object } = await generateObject({
    model: heavyModel,
    schema: StoryArcSchema,
    prompt: [
      `You are a showrunner planning a serialized narrative titled "${title}".`,
      "Transform the premise into global characters and a clear episode-by-episode arc.",
      `Premise:\n${rawStory}`,
      `Return exactly ${episodeCount} episode_goals with sequential episode_number fields from 1 to ${episodeCount}.`,
      "Keep each narrative_goal concise (under 25 words) and avoid duplicating beats.",
      "Ensure global_characters include distinct roles and traits that recur across the series.",
    ].join("\n\n"),
  });

  const parsed = StoryArcSchema.parse(object);
  if (parsed.episode_goals.length !== episodeCount) {
    throw new Error(
      `Expected ${episodeCount} episode_goals but received ${parsed.episode_goals.length}.`
    );
  }

  return parsed;
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
  const worldState = previousLedger
    ? JSON.stringify(previousLedger, null, 2)
    : "None — this is the opening episode.";

  const { object } = await generateObject({
    model: heavyModel,
    schema: EpisodeGenerationSchema,
    prompt: [
      `You are writing Episode ${episodeNumber} of a serialized show.`,
      `Episode goal: ${episodeGoal}`,
      "Write a tight, visual script around ~150 words (about 90 seconds of screen time).",
      "Return the script_content and an updated continuity_ledger capturing new facts and relationship shifts.",
      "Keep the ledger succinct (≤5 facts and ≤5 relationships) and ensure names align with prior episodes.",
      `World State (continuity ledger from previous episodes):\n${worldState}`,
    ].join("\n\n"),
  });

  return EpisodeGenerationSchema.parse(object);
}

// ─── Placeholder: Model 1 — Sentiment Analysis (NLP) ────────────────────────

/**
 * Analyzes script content and returns emotion + intensity for each 10-sec segment.
 * TODO: Replace with roberta-base-go_emotions API call.
 */
export async function analyzeEpisodeSentiment(
  scriptContent: string
): Promise<SentimentAnalysis> {
  const chunks = buildWordChunks(scriptContent);
  const inputs = chunks.map((chunk) => chunk.text);

  const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!huggingFaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not set.");
  }

  // Use one batched HF inference request with an array of chunk inputs.
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/SamLowe/roberta-base-go_emotions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${huggingFaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Hugging Face sentiment request failed (${response.status}): ${body}`);
  }

  const raw = (await response.json()) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected Hugging Face sentiment response shape.");
  }

  type HFClassification = { label: string; score: number };
  const normalized: HFClassification[][] = Array.isArray(raw[0])
    ? (raw as HFClassification[][])
    : [raw as HFClassification[]];

  if (normalized.length === 0 || normalized.every((entry) => !Array.isArray(entry) || entry.length === 0)) {
    throw new Error("Hugging Face sentiment response was empty.");
  }

const EMOTION_WEIGHTS: Record<string, number> = {
  neutral: 0.1,   
  approval: 0.2,
  realization: 0.6,
  curiosity: 0.7,
  nervousness: 0.7,
  surprise: 0.8,
  anger: 0.8,
  fear: 0.9,
  excitement: 0.9
};

const segments = chunks.map((chunk, index) => {
  const predictions = normalized[index] ?? normalized[0];
  const top = predictions.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  const baseWeight = EMOTION_WEIGHTS[top.label] ?? 0.5;
  const calculatedIntensity = top.score * baseWeight;

  return {
    start_sec: chunk.start_sec,
    end_sec: chunk.end_sec,
    text: chunk.text,
    emotion: top.label,
    emotion_intensity: parseFloat(calculatedIntensity.toFixed(4)), 
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
  const opening = takeWords(scriptContent, 25);
  const closing = takeWords(scriptContent, 40, true);

  const { object } = await generateObject({
    model: fastModel,
    schema: HookCliffhangerSchema,
    prompt: [
      "Assess the hook and cliffhanger strength of this episode script.",
      "Focus only on the opening (~10s) and closing (~15s) excerpts provided.",
      `Opening excerpt:\n${opening}`,
      `Closing excerpt:\n${closing}`,
      "Return a hook pattern and novelty_score plus cliffhanger open_loops, threat_level (0-1), and brief logic rationale.",
    ].join("\n\n"),
  });

  return HookCliffhangerSchema.parse(object);
}

// ─── Placeholder: Agent 3 — Optimization Critic ─────────────────────────────

/**
 * Analyzes segments for low-engagement zones and suggests improvements.
 * TODO: Replace with Heavy LLM call, triggered only when drop_probability > 0.6 or cliffhanger_score < 5.
 */
export async function suggestOptimizations(
  segments: SentimentAnalysis["segments"]
): Promise<OptimizationCritic> {
  const highRiskSegments = segments.filter((seg) => seg.emotion_intensity < 0.15);

  if (highRiskSegments.length === 0) {
    const empty: OptimizationCritic = {
      issues: [],
      optimization_suggestions: [],
    };
    OptimizationCriticSchema.parse(empty);
    return empty;
  }

  const { object } = await generateObject({
    model: fastModel,
    schema: OptimizationCriticSchema,
    prompt: [
      "Identify engagement risks in these episode segments and propose fixes.",
      "Only consider segments where emotion_intensity < 0.15.",
      `Segments (JSON):\n${JSON.stringify(highRiskSegments, null, 2)}`,
      "Return issues with type, target_time_sec, severity plus matching optimization_suggestions that are concise and actionable.",
    ].join("\n\n"),
  });

  return OptimizationCriticSchema.parse(object);
}
