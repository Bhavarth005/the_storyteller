import { generateObject } from "ai";
import { z } from "zod/v4";
import { fastModel, heavyModel } from "./ai-clients";

// ─── HTML stripping (for HTML-stored script content) ─────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
  reason: z.string(),
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
      `You are a master showrunner designing a ${episodeCount}-episode serialized vertical short-form series titled "${title}".`,
      "Each episode is exactly 90 seconds (~150 words). Viewers can swipe away at any moment.",
      "",
      "STORY PREMISE:",
      rawStory,
      "",
      `Design exactly ${episodeCount} episodes. For each episode's narrative_goal, include:`,
      "1. The HOOK — what happens in the first 10 seconds that creates immediate curiosity",
      "2. The CORE BEAT — the single most important thing that happens",
      "3. The CLIFFHANGER — the last 10 seconds, an unresolved tension that demands the next episode",
      "",
      "Format each narrative_goal as: '[HOOK: ...] [BEAT: ...] [CLIFFHANGER: ...]'",
      "Keep each section under 15 words. Make the cliffhanger physically or emotionally painful to leave unresolved.",
      "",
      "For global_characters: include only characters who appear in 3+ episodes. Give each distinct traits.",
      `Return exactly ${episodeCount} episode_goals numbered 1 to ${episodeCount}.`,
    ].join("\n"),
  });

  const parsed = StoryArcSchema.parse(object);
  if (parsed.episode_goals.length !== episodeCount) {
    throw new Error(`Expected ${episodeCount} episode_goals but received ${parsed.episode_goals.length}.`);
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
    : "None — this is the opening episode. Establish world and protagonist immediately.";

  const { object } = await generateObject({
    model: heavyModel,
    schema: EpisodeGenerationSchema,
    prompt: [
      `Write Episode ${episodeNumber} of a serialized short-form series.`,
      "",
      "EPISODE BLUEPRINT:",
      episodeGoal,
      "",
      "HARD RULES:",
      "- script_content must be 140-160 words. Count carefully.",
      "- Write in present tense. Visual action description. No dialogue tags.",
      "- First 25 words: execute the HOOK from the blueprint. Start mid-action, never with setup.",
      "- Middle section: execute the CORE BEAT. One clear escalation.",
      "- Last 20 words: execute the CLIFFHANGER from the blueprint exactly. End on the sharpest possible beat.",
      "- NEVER start with 'Previously...' or any recap.",
      "- NEVER resolve the prior episode's cliffhanger in the first sentence.",
      "",
      "WORLD STATE (honor this exactly — no contradictions):",
      worldState,
      "",
      "After writing the script, update the continuity_ledger with any new facts, secrets revealed, or relationship changes introduced in THIS episode only.",
      "Keep ledger concise: max 5 information_state facts, max 5 relationships.",
    ].join("\n"),
  });

  return EpisodeGenerationSchema.parse(object);
}

// ─── Placeholder: Model 1 — Sentiment Analysis (NLP) ────────────────────────

/**
 * Analyzes script content and returns emotion + intensity for each 10-sec segment.
 * TODO: Replace with roberta-base-go_emotions API call.
 */
const HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/SamLowe/roberta-base-go_emotions";

const EMOTION_WEIGHTS: Record<string, number> = {
  neutral: 0.05,
  approval: 0.2,
  realization: 0.55,
  curiosity: 0.7,
  nervousness: 0.75,
  disapproval: 0.5,
  annoyance: 0.45,
  surprise: 0.8,
  anger: 0.85,
  fear: 0.9,
  excitement: 0.9,
  sadness: 0.6,
  grief: 0.85,
  disgust: 0.65,
};

async function callHuggingFaceWithRetry(
  inputs: string[],
  maxRetries = 3
): Promise<Array<Array<{ label: string; score: number }>>> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HUGGINGFACE_API_KEY");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        parameters: { top_k: 5 },
        options: { wait_for_model: true, use_cache: false },
      }),
    });

    // 503 = model loading (cold start) — wait and retry
    if (response.status === 503) {
      const waitMs = (attempt + 1) * 8000;
      console.log(`[HuggingFace] Model loading, waiting ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HuggingFace request failed (${response.status}): ${body}`);
    }

    const raw = await response.json() as unknown;
    if (!Array.isArray(raw)) throw new Error("Unexpected HuggingFace response shape.");

    // Normalize: batched returns array of arrays, single returns flat array
    const normalized: Array<Array<{ label: string; score: number }>> =
      Array.isArray(raw[0]) ? raw as Array<Array<{ label: string; score: number }>> : [raw as Array<{ label: string; score: number }>];

    return normalized;
  }

  throw new Error(`HuggingFace call failed after ${maxRetries} retries.`);
}

export async function analyzeEpisodeSentiment(
  scriptContent: string
): Promise<SentimentAnalysis> {
  const chunks = buildWordChunks(stripHtml(scriptContent));
  const inputs = chunks.map(c => c.text).filter(t => t.trim().length > 3);

  const predictions = await callHuggingFaceWithRetry(inputs);

  const segments = chunks.map((chunk, index) => {
    const preds = predictions[index] ?? predictions[0] ?? [];
    const top = preds.length > 0
      ? preds.reduce((best, curr) => curr.score > best.score ? curr : best)
      : { label: "neutral", score: 0.5 };

    const weight = EMOTION_WEIGHTS[top.label] ?? 0.5;
    const emotion_intensity = parseFloat((top.score * weight).toFixed(4));

    return {
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      text: chunk.text,
      emotion: top.label,
      emotion_intensity,
    };
  });

  return SentimentAnalysisSchema.parse({ segments });
}

// ─── Placeholder: Agent 2 — Hook & Cliffhanger Evaluator ────────────────────

/**
 * Evaluates the hook strength and cliffhanger power of a script.
 * TODO: Replace with Fast LLM call (gpt-4o-mini / gemini-1.5-flash).
 */
export async function evaluateEpisodeHooks(
  scriptContent: string,
  segmentData?: SentimentAnalysis["segments"]
): Promise<HookCliffhanger> {
  // If segment data is provided and looks healthy, skip the LLM call entirely
  if (segmentData && segmentData.length > 0) {
    const firstSegment = segmentData[0];
    const lastTwoSegments = segmentData.slice(-2);
    const avgLastIntensity = lastTwoSegments.reduce((s, seg) => s + seg.emotion_intensity, 0) / lastTwoSegments.length;

    // Hook is strong (first segment high intensity) AND cliffhanger is strong (last segments high intensity)
    if (firstSegment.emotion_intensity > 0.5 && avgLastIntensity > 0.5) {
      // Return a good score without burning an LLM call
      return {
        hook: { pattern: "strong_opening", novelty_score: firstSegment.emotion_intensity },
        cliffhanger: {
          open_loops: 2,
          threat_level: avgLastIntensity,
          logic: "High emotional intensity detected at episode end via NLP.",
        },
      };
    }
  }

  // Only call LLM when the episode actually has structural problems
  const plain = stripHtml(scriptContent);
  const opening = takeWords(plain, 25);
  const closing = takeWords(plain, 40, true);

  const { object } = await generateObject({
    model: fastModel,
    schema: HookCliffhangerSchema,
    prompt: [
      "You are a script analyst for 90-second vertical video episodes.",
      "Assess hook and cliffhanger strength. Be specific about what works or fails.",
      "",
      `Opening (first ~10 seconds):\n${opening}`,
      "",
      `Closing (last ~15 seconds):\n${closing}`,
      "",
      "Scoring guide:",
      "novelty_score 0.8-1.0: Creates immediate life-or-death curiosity, impossible to swipe away",
      "novelty_score 0.5-0.79: Moderate interest, viewer might stay",
      "novelty_score 0.0-0.49: Exposition dump, weak opening, viewer will leave",
      "threat_level 0.8-1.0: Devastating cliffhanger, physically painful to stop",
      "threat_level 0.5-0.79: Good tension, viewer wants next episode",
      "threat_level 0.0-0.49: Weak exit, episode feels complete — kills series momentum",
      "",
      "Return honest scores. Vague or inflated scores are useless.",
    ].join("\n"),
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
  // Identify problem segments: neutral emotion OR very low intensity
  // Use the same logic as math-engine's drop detection
  const problemSegments = segments.filter(
    seg => seg.emotion === "neutral" || seg.emotion_intensity < 0.25
  );

  // Skip LLM call if no real problems detected — saves tokens
  if (problemSegments.length === 0) {
    return { issues: [], optimization_suggestions: [] };
  }

  // Only send problem segments to the LLM, not the full array
  const { object } = await generateObject({
    model: fastModel,
    schema: OptimizationCriticSchema,
    prompt: [
      "You are a script doctor for 90-second vertical short-form episodes.",
      "These segments have been flagged as retention risks by NLP analysis.",
      "Propose surgical fixes — specific insertions or single-sentence changes, NOT full rewrites.",
      "",
      "FLAGGED SEGMENTS:",
      JSON.stringify(problemSegments, null, 2),
      "",
      "For each issue: name the type (emotional_flatline, pacing_drag, weak_stakes, missing_tension),",
      "the target_time_sec, and severity (low/medium/high).",
      "For each suggestion: give a concrete actionable fix at the target_time_sec.",
      "Maximum 3 suggestions. Prioritize by impact.",
    ].join("\n"),
  });

  return OptimizationCriticSchema.parse(object);
}
