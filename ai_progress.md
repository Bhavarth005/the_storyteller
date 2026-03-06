# Episodic Intelligence Engine - AI/ML Integration Progress

## Phase 1: AI/ML Environment & SDK Setup
- [x] Install Vercel AI SDK and Google provider: `bun add ai @ai-sdk/google` — Already present in `package.json` (`ai ^6.0.116`, `@ai-sdk/google ^3.0.43`).
- [x] Install Hugging Face inference client: `bun add @huggingface/inference` — Installed by user; package confirmed in `bun.lock`.
- [x] Update `.env` with required keys: `GOOGLE_GENERATIVE_AI_API_KEY` and `HUGGINGFACE_API_KEY` — Both keys present in `.env`.
- [x] Initialize the clients in a new config file `src/lib/ai-clients.ts` — Created with `createGoogleGenerativeAI` factory (`gemini-1.5-pro` + `gemini-1.5-flash`) and `HfInference` client; throws on missing env vars.

## Phase 2: Agent 0 — The Macro-Planner
- [x] Target: `generateStoryArc` in `src/lib/ai-orchestrator.ts`
- [x] Model: `gemini-1.5-pro` (Heavy Reasoning) — wired via `heavyModel` from `ai-clients.ts`.
- [x] Implementation: Uses Vercel AI SDK `generateObject` with `StoryArcSchema`; prompt includes title, premise, and explicit instruction to return exactly `episodeCount` goals.
- [x] Output mapping: Parses against `StoryArcSchema`; throws if returned goal count does not match requested `episodeCount`.

## Phase 3: Agent 1 — The Narrative Architect & Continuity State
- [x] Target: `generateEpisodeScript` in `src/lib/ai-orchestrator.ts`
- [x] Model: `gemini-1.5-pro` (Heavy Reasoning) — wired via `heavyModel`.
- [x] Implementation: Uses `generateObject` to write a ~150-word, 90-second episode script.
- [x] State Passing: `previousLedger` (or `"None — this is the opening episode."`) injected verbatim as JSON into the prompt's World State section.
- [x] Output mapping: Parses against `EpisodeGenerationSchema`.

## Phase 4: NLP Forensics (The Math Engine Bridge)
- [x] Target: `analyzeEpisodeSentiment` in `src/lib/ai-orchestrator.ts`
- [x] Model: `SamLowe/roberta-base-go_emotions` via Hugging Face Inference REST API.
- [x] Implementation: `buildWordChunks()` utility splits script into 25-word / 10-second blocks.
- [x] Batching: All chunks sent as one `POST` with `{ inputs: string[] }` to reduce latency.
- [x] Data Transformation: Top label+score per chunk mapped to `emotion` / `emotion_intensity` for the tension-curve math engine.

## Phase 5: Fast Critics — Agents 2 & 3
- [x] Target: `evaluateEpisodeHooks` in `src/lib/ai-orchestrator.ts`
- [x] Model: `gemini-1.5-flash` — wired via `fastModel`.
- [x] Implementation: `takeWords()` extracts first 25 words (opening ~10s) and last 40 words (closing ~15s); only those excerpts go into the prompt.
- [x] Target: `suggestOptimizations` in `src/lib/ai-orchestrator.ts`
- [x] Model: `gemini-1.5-flash` — wired via `fastModel`.
- [x] Implementation: Filters for `emotion_intensity < 0.35` segments; returns empty arrays (no API call) if none qualify; otherwise sends only high-risk segments to `generateObject`.

## Phase 6: API Wiring & Serverless Defense
- [x] `POST /api/generate-core` already calls real `generateStoryArc` and sequentially calls `generateEpisodeScript` — no route changes needed; continuity chain was already wired in Phase 10 of backend build.
- [x] Sequential `for` loop passes `continuity_ledger` from Episode N as `previousLedger` for Episode N+1 — confirmed working in `app/api/generate-core/route.ts`.
- [x] `POST /api/analyze-episode` already runs `analyzeEpisodeSentiment` + `evaluateEpisodeHooks` in `Promise.all()` — no route changes needed.
- [x] TypeScript compile errors fixed:
  - `app/api/versions/compare/route.ts` — `RadarMetrics` missing required `hook_strength` + `suspense_density` fields → added `toRadarMetrics()` helper with proper fallbacks.
  - `app/api/versions/compare/route.ts` — `overallEngagementScore`/`averageCliffhanger` typed as `string | null` from Drizzle `numeric` columns → widened helper param type to `string | number | null`.

## Phase 7: End-to-End Testing (Postman)
- [ ] Fire `POST /api/generate-core` with a cyberpunk or thriller premise. Verify DB inserts.
- [ ] Fire `POST /api/analyze-version` to trigger the background analysis loop.
- [ ] Poll `GET /api/status?version_id={id}` until `"status": "complete"`.
- [ ] Verify `GET /api/projects/:id` returns fully enriched JSONB payloads with real math and AI content.
