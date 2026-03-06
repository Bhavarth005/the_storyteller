# Frontend Integration Progress

## Phase 1: Setup & Pruning
- [x] Initialize TanStack Query provider in the root layout.
- [x] Audit all v0 components and delete UI elements with no matching API.
- [x] Set up basic Axios/Fetch API utility client.

## Phase 2: Dashboard & CRUD (`/`)
- [x] Integrate `GET /api/projects` for the dashboard grid.
- [x] Integrate `DELETE /api/projects/:id`.
- [x] Integrate `PATCH /api/projects/:id` for renaming.

## Phase 3: The Genesis Flow (`/project/new`) - FRONTEND ORCHESTRATION
- [x] Step 1: Wire form to `POST /api/generate-core`. On success, extract `version_id` and the array of `episode_ids`.
- [x] Step 2: Loop over `episode_ids` and fire `POST /api/analyze-episode` sequentially or via `Promise.allSettled`. **Crucial:** Configure TanStack mutation to automatically retry on 504 Gateway Timeouts. Implement a multi-step loading UI checklist to show progress.
- [x] Step 3: Once all episodes return 200 OK, fire `POST /api/finalize-version`.
- [x] Redirect to `/project/[id]` upon completion.

## Phase 4: Series Overview (`/project/[id]`)
- [x] Fetch complete state using `GET /api/projects/:id`.
- [x] Map `radar_metrics` to a Recharts Radar component.
- [x] Populate the Continuity Tracker sidebar using `global_characters`.
- [x] Implement the Weakest Link detector (sort episodes by `engagement_score` and flag the lowest).
- [x] Implement Version Timeline using `GET /api/projects/:id/versions`.
- [x] Implement Rollback (`POST /api/rollback`) and Version Diff modal (`GET /api/versions/compare`).

## Phase 5: Core Workspace (`/project/[id]/episode/[no]`)
- [x] Fetch episode data via `GET /api/episodes/:id`.
- [x] **Tiptap Editor Highlights:** Parse the `script_segments` JSONB array. Apply `bg-red-200` (or dark mode equivalent) to text where `drop_probability > 0.7`. Apply `bg-yellow-200` to text where `emotion === 'neutral'`.
- [x] **Timeline Heatmap:** Build a horizontal bar above the editor mapping the 90s timeline with green/yellow/red blocks based on `script_segments`.
- [x] Fetch Tension Curve via `GET /api/episodes/:id/tension-curve` and render with Recharts line graph.
- [x] Fetch AI explanations via `GET /api/episodes/:id/explain` for sidebar tooltips.
- [x] Wire up "Apply AI Fix / Regenerate" to `POST /api/regenerate-episode`. On success, instantly update the UI pointer to the `new_version_id` and run the analysis orchestration for that specific episode.
