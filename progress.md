# Episodic Intelligence Engine - Backend Build Progress

## Phase 1: Environment & Repository Setup
- [x] Install backend dependencies using `bun add`: drizzle-orm, postgres, dotenv, zod. — Installed drizzle-orm, postgres, dotenv, zod via bun.
- [x] Install dev dependencies using `bun add -d`: drizzle-kit, tsx, @types/node. — Installed drizzle-kit, tsx, @types/node as dev dependencies via bun.

## Phase 2: Database Initialization
- [x] Create a `.env` file in the root. Based on the provided `docker-compose.yaml`, add the database URL: `DATABASE_URL=postgresql://bhavarth:admin@localhost:5432/episodic_intelligence` — Created .env with DATABASE_URL.
- [x] Instruct me to run `docker-compose up -d` in my WSL terminal to start the DB. — User ran docker-compose up -d, Postgres container is running.

## Phase 3: Drizzle ORM Configuration
- [x] Create `drizzle.config.ts` in the root directory configured for PostgreSQL, pointing to the `.env` URL and the schema file at `src/db/schema.ts`. — Created with dialect "postgresql", schema path, and dotenv-loaded DB URL.
- [x] Create the database connection instance at `src/db/index.ts` using the `postgres` driver. — Created using postgres-js driver with full schema import for relational queries.

## Phase 4: Schema Definition
- [x] Read the provided `data_model_spec.md` file. — Reviewed all entities, enums, JSONB schemas, constraints, and relationships.
- [x] Create `src/db/schema.ts`. — Created with full Drizzle ORM definitions.
- [x] Translate the Entities (projects, versions, episodes, version_analysis) into Drizzle ORM table definitions. — All 4 tables defined with correct column types, defaults, and FK references.
- [x] Ensure `jsonb` columns are used exactly where specified for arrays/objects (e.g., script_segments, radar_metrics). — 8 JSONB columns across episodes, versions, and version_analysis.
- [x] Define the Enums (`analysis_status`, `input_type`). — Defined via pgEnum with correct values.
- [x] Setup the relationships (one-to-many, one-to-one) using Drizzle's `relations` API. — All relations defined: project↔versions, project↔episodes, version↔episodes, version↔versionAnalysis, self-referential version lineage.

## Phase 5: Migrations
- [x] Add migration scripts to `package.json` (e.g., `"db:generate": "drizzle-kit generate", "db:push": "drizzle-kit push"`). — Added db:generate, db:push, db:migrate, and db:studio scripts.
- [x] Instruct me to run the generate and push commands to sync the schema to the Docker Postgres DB. — User ran db:generate and db:push, schema synced to Postgres.

## Phase 6: API Route Scaffolding (App Router)
- [x] Read the provided `api_spec.md` file. — Mapped all 17 endpoints to App Router folder structure.
- [x] Create the exact folder structure required for the Next.js App Router inside `src/app/api/`. — Created 16 folders covering projects, versions, episodes, and AI pipeline routes.
- [x] Create a `route.ts` file inside each folder with empty boilerplate `export async function GET/POST/PATCH/DELETE` functions returning a 501 Not Implemented status. — All 17 route files created with correct HTTP methods and 501 responses.
## Phase 7: Core Project & Version CRUD
- [x] Implement `GET /api/projects`: Fetch all projects from the DB, ordered by `updatedAt` descending. — Implemented with pagination (page/limit query params), snake_case JSON response.
- [x] Implement `GET /api/projects/[id]`: Fetch a single project and JOIN its active version data (using Drizzle relational queries). — Uses db.query relational API with nested activeVersion→episodes→versionAnalysis, UUID validation via Zod.
- [x] Implement `PATCH /api/projects/[id]`: Allow renaming the project title. — Zod-validated body, returns updated title + updated_at, 404 on missing project.
- [x] Implement `DELETE /api/projects/[id]`: Ensure cascading deletes work correctly. — UUID validation, returns 204 on success, 404 on missing project.
- [x] Implement `POST /api/generate-core` (Initial Setup): Create Project, Version, placeholder Episodes, and link activeVersionId. — Full transactional flow: Project→Version(pending)→3 placeholder Episodes→links activeVersionId, Zod validation on body.

## Phase 7.5: Heuristic Engine & Mock Seeder
- [x] Create `src/lib/math-engine.ts` with SMA smoothing logic for tension curves. — Implemented calculateTensionCurve (3-pt SMA + tension formula), detectRetentionRisks (consecutive low-tension flagging), calculateVersionDelta (signed string deltas).
- [x] Implement `deriveEngagementScore` heuristic formula. — Weighted formula (hook*0.35 + variance*0.35 + cliffhanger*0.30), plus calculateEmotionalVariance (std dev).
- [x] Create `src/db/seed.ts` to populate the DB with "perfect" mock data. — Seeds "The Neon Detective" project with 1 complete version, 3 episodes with realistic script_segments/metrics/continuity JSONB, and version_analysis with radar_metrics.
- [ ] Verify `GET /api/projects/:id` returns the smoothed math correctly.

## Phase 8: Remaining Read & Utility APIs
- [x] Implement `GET /api/projects/:id/versions`: Fetch all versions for a project, ordered by creation date. — Drizzle select with desc(createdAt), UUID validation, 404 on missing project.
- [x] Implement `GET /api/versions/:id/characters`: Return the `globalCharacters` JSONB for a version. — Returns version_id + characters array, UUID validation, 404 handling.
- [x] Implement `GET /api/versions/:id/analytics`: Return the `versionAnalysis` JSONB for a version. — Returns numeric fields + radar_metrics via relational query, 404 on missing analysis.
- [x] Implement `GET /api/versions/compare`: Take `base_id` and `target_id` query params, fetch both `versionAnalysis` records, and use `calculateVersionDelta` from `src/lib/math-engine.ts`. — Builds RadarMetrics from analysis rows, returns signed string deltas.
- [x] Implement `GET /api/episodes/:id/explain`: Fetch an episode and return its `optimizationSuggestions`. — Aggregates cliffhanger_logic, retention_risk_reason, optimization_rationale from suggestions array.
- [x] Implement `DELETE /api/versions/:id`: Delete a version (prevents deleting the active version). — Checks activeVersionId before delete, returns 204 or 400 CANNOT_DELETE_ACTIVE.
- [x] Implement `POST /api/rollback`: Update `projects.activeVersionId` to the provided `target_version_id`. — Zod-validated body, verifies version belongs to project, updates pointer.
- [x] **Bonus:** Implement `GET /api/episodes/:id` — Full episode read with snake_case response.
- [x] **Bonus:** Implement `GET /api/episodes/:id/tension-curve` — Reads scriptSegments + threat_level, runs calculateTensionCurve from math-engine.
- [x] **Bonus:** Implement `GET /api/versions/:id` — Full version payload with nested episodes + versionAnalysis.

## Phase 9: The AI Orchestrator Scaffolding
- [x] Create `src/lib/ai-orchestrator.ts`. — Created with full Zod schemas and 5 placeholder functions.
- [x] Define strict Zod schemas for the expected AI JSON outputs based on `docs/ai_spec.md` (e.g., `EpisodeGenerationSchema`, `SentimentAnalysisSchema`). — 8 schemas defined: StoryArcSchema, EpisodeGenerationSchema, ContinuityLedgerSchema, SentimentAnalysisSchema, HookCliffhangerSchema, OptimizationCriticSchema, plus sub-schemas.
- [x] Create exported async placeholder functions:
    1. `generateStoryArc(title, story)`: Returns mock global characters and 8 mock episode outlines. — Returns 3 characters + 8 narrative goals, validated via StoryArcSchema.
    2. `generateEpisodeScript(goal, number, prevLedger)`: Returns mock script + continuity ledger. — Validated via EpisodeGenerationSchema.
    3. `analyzeEpisodeSentiment(scriptContent)`: Returns mock raw NLP segments (0.0 - 1.0). — Generates realistic intensity curve with sin wave + position bias, validated via SentimentAnalysisSchema.
    4. `evaluateEpisodeHooks(scriptContent)`: Returns mock hook and cliffhanger scores. — Word-count-based scores, validated via HookCliffhangerSchema.
    5. `suggestOptimizations(segments)`: Returns mock text suggestions. — Scans for low-intensity zones, always returns ≥1 suggestion, validated via OptimizationCriticSchema.
- [x] All functions return objects that pass their Zod schemas (.parse called inside each function).

## Phase 10: The Generation & Analysis Pipelines (Write APIs)
- [ ] Implement `POST /api/generate-core`: Full pipeline — validate body, insert Project→Version→Episodes from AI placeholders, link activeVersionId.
- [ ] Implement `POST /api/analyze-episode`: Fetch episode text, call sentiment + hooks placeholders, run math-engine, update episode JSONB.
- [ ] Implement `POST /api/analyze-version` & `GET /api/status`: Set version to 'processing', analyze all episodes in background, aggregate into version_analysis, set 'complete'. Status endpoint returns analysisStatus.
- [ ] Implement `POST /api/regenerate-episode`: Duplicate parent version + episodes, replace target episode via AI placeholder, queue analysis.