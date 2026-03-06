# Episodic Intelligence Engine - Data Model Specification

## Purpose

This document defines the data architecture and database schema for the Episodic Intelligence Engine. The system processes raw narrative inputs, segments them into standardized episodic formats, and applies asynchronous ML/NLP pipelines to generate granular retention, sentiment, and structural analytics. The data model enforces a strict version-control paradigm to manage iterative AI generations and manual user edits seamlessly.

## Core Invariants

- **Linear Version History:** Revisions to stories (whether AI-generated or user-edited) stack linearly. The `projects.active_version_id` strictly defines the current readable state.
- **Asynchronous State Tracking:** AI generation and analysis pipelines operate asynchronously. The `versions` table acts as the state machine, tracking `analysis_status` to ensure data consistency before UI consumption.
- **Relational Integrity with JSONB Extension:** Core hierarchical relationships (Projects → Versions → Episodes) enforce strict referential integrity via Foreign Keys. Complex, deeply nested, or time-series analytical data (e.g., second-by-second sentiment arrays) are stored in `JSONB` to optimize query performance and schema flexibility.
- **Immutable Analytics:** Once a version transitions to a `complete` status, its associated episodes, metrics, and JSONB payloads become immutable read-only records.

## Enumerations

These enumerations must be enforced at the database level (e.g., Postgres ENUMs) or application ORM level:

```sql
enum analysis_status = { 'pending', 'processing', 'complete', 'failed' }
enum input_type      = { 'idea', 'draft' }
```

---

## Entities

### Projects

The root entity representing a discrete story concept or draft. It acts as the stable identifier for all subsequent versioning.

Table: `projects`

| Column               | Type        | Nullable | Notes                                                              |
| -------------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `id`                 | UUID        | NO       | Primary key (default: `gen_random_uuid()`)                         |
| `title`              | Text        | NO       | Human-readable title                                               |
| `input_type`         | input_type  | NO       | Defines initialization routing pipeline (`idea` vs `draft`)        |
| `original_raw_story` | Text        | NO       | The exact initial string payload provided by the user              |
| `active_version_id`  | UUID        | YES      | FK to `versions`; authoritative pointer to current active state    |
| `created_at`         | Timestamptz | NO       | Timestamp of creation                                              |
| `updated_at`         | Timestamptz | NO       | Auto-updated on row mutation                                       |

**Constraints:**
- `active_version_id` REFERENCES `versions(id)` with `DEFERRABLE INITIALLY DEFERRED`.

---

### Versions

Represents a specific iteration of a Project. Controls the asynchronous state of the AI analysis pipeline and stores global narrative context.

Table: `versions`

| Column                | Type            | Nullable | Notes                                                              |
| --------------------- | --------------- | -------- | ------------------------------------------------------------------ |
| `id`                  | UUID            | NO       | Primary key                                                        |
| `project_id`          | UUID            | NO       | FK to `projects` (ON DELETE CASCADE)                               |
| `parent_version_id`   | UUID            | YES      | FK to `versions`; null for the initial baseline generation         |
| `commit_message`      | Text            | NO       | System or user-generated description of the iteration              |
| `analysis_status`     | analysis_status | NO       | Tracks async pipeline progression                                  |
| `generation_metadata` | JSONB           | YES      | MLOps tracking (model versions, temperature, prompt hashes)        |
| `global_characters`   | JSONB           | YES      | Array of extracted narrative entities ensuring global continuity   |
| `created_at`          | Timestamptz     | NO       | Timestamp of creation                                              |

**Indexes:** `project_id`, `analysis_status`.

**JSONB Schema `global_characters`:**
```json
[
  {
    "name": "string",
    "description": "string",
    "traits": ["string"]
  }
]
```

---

### Episodes

The granular hub for narrative content and machine learning outputs. Denormalized with `project_id` to allow direct, flat queries.

Table: `episodes`

| Column                         | Type    | Nullable | Notes                                                              |
| ------------------------------ | ------- | -------- | ------------------------------------------------------------------ |
| `id`                           | UUID    | NO       | Primary key                                                        |
| `project_id`                   | UUID    | NO       | FK to `projects` (ON DELETE CASCADE)                               |
| `version_id`                   | UUID    | NO       | FK to `versions` (ON DELETE CASCADE)                               |
| `episode_number`               | Integer | NO       | Sequential ordering index                                          |
| `title`                        | Text    | NO       | Generated episode title                                            |
| `script_content`               | Text    | NO       | The canonical formatted script text                                |
| `script_segments`              | JSONB   | YES      | Time-blocked NLP analysis containing sentiment and retention logic |
| `hook_and_cliffhanger_metrics` | JSONB   | YES      | Entry/Exit structural evaluation and heuristic scoring             |
| `optimization_suggestions`     | JSONB   | YES      | Agent-generated structural improvement recommendations             |
| `character_appearances`        | JSONB   | YES      | Array of character names present in the episode sequence           |
| `continuity_ledger`             | JSONB    | YES      | State Tracking for character and timeline continuity                  |

**Constraints:**
- `CHECK (episode_number > 0)`
- `UNIQUE(version_id, episode_number)`

**Indexes:** `project_id`, `version_id`, `episode_number`.

**JSONB Schema `script_segments`:**
```json
[
  {
    "start_sec": "integer",
    "end_sec": "integer",
    "text": "string",
    "emotion": "string",
    "drop_probability": "float",
    "engagement_score": "float"
  }
]
```
**JSONB Schema `continuity_ledger`:**
```json
{
  "information_state": [
    { "fact": "John is the mole", "known_by": ["John", "Sarah"], "unknown_by": ["The Boss"] }
  ],
  "relationship_state": [
    { "entities": ["John", "Sarah"], "dynamic": "Allies with secret tension" }
  ],
  "inventory_state": [
    { "item": "The Flash_Drive", "held_by": "Sarah" }
  ]
}
```

---

### Version Analysis

Aggregated metrics computed upon the completion of a Version's episode processing pipeline. Exists as a 1:1 mapped table to its parent version.

Table: `version_analysis`

| Column                     | Type    | Nullable | Notes                                                           |
| -------------------------- | ------- | -------- | --------------------------------------------------------------- |
| `id`                       | UUID    | NO       | Primary key                                                     |
| `version_id`               | UUID    | NO       | FK to `versions` (ON DELETE CASCADE)                            |
| `overall_engagement_score` | Numeric | YES      | Computed mathematical average across episode segments           |
| `average_cliffhanger`      | Numeric | YES      | Computed mathematical average of exit scores                    |
| `emotional_variance_index` | Numeric | YES      | Standard deviation metric of sentiment shifts                   |
| `radar_metrics`            | JSONB   | YES      | Normalized [0,1] dataset optimized for frontend visualization   |

**Constraints:**
- `UNIQUE(version_id)`

---

## Entity Relationship Diagram

```text
┌─────────────────┐       ┌──────────────────────┐
│    projects     │◄──────│      versions        │
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │       │ id (PK)              │
│ title           │       │ project_id (FK)      │
│ input_type      │       │ parent_version_id    │──┐ (Self-Referential Linear Tree)
│ raw_story       │       │ analysis_status      │◄─┘
│ active_version  │───┐   │ global_characters    │
└────────┬────────┘   │   └──────────┬───────────┘
         │            │              │
         │ 1:N        │              │ 1:1
         ▼            │              ▼
┌─────────────────────┤   ┌──────────────────────┐
│     episodes        │   │   version_analysis   │
├─────────────────────┤   ├──────────────────────┤
│ id (PK)         ◄───┘   │ id (PK)              │
│ project_id (FK)     │   │ version_id (FK)      │
│ version_id (FK)     │   │ radar_metrics (JSON) │
│ episode_number      │   │ overall_scores       │
│ script_segments     │   └──────────────────────┘
│ cliffhanger_metrics │
└─────────────────────┘
```

---

## Access Patterns & Query Architecture

### 1. Active State Retrieval
To fetch the complete authoritative state of a project for application rendering, join across the `active_version_id` pointer:

```sql
SELECT 
    v.id AS version_id,
    v.global_characters,
    v.analysis_status,
    va.radar_metrics,
    json_agg(
        json_build_object(
            'id', e.id,
            'episode_number', e.episode_number,
            'title', e.title,
            'script_content', e.script_content,
            'script_segments', e.script_segments,
            'metrics', e.hook_and_cliffhanger_metrics,
            'suggestions', e.optimization_suggestions
        ) ORDER BY e.episode_number
    ) AS episodes
FROM projects p
JOIN versions v ON p.active_version_id = v.id
LEFT JOIN version_analysis va ON v.id = va.version_id
LEFT JOIN episodes e ON v.id = e.version_id
WHERE p.id = :project_id
GROUP BY v.id, va.id;
```

### 2. Transactional Update Strategy
When updating JSONB payloads from independent asynchronous AI agents, execute a single `UPDATE` per episode to prevent concurrency locking:

```sql
UPDATE episodes 
SET 
    script_segments = :segments_json,
    hook_and_cliffhanger_metrics = :metrics_json,
    optimization_suggestions = :suggestions_json
WHERE id = :episode_id;
```
---

## Implementation Notes for Agents & APIs

### 1. Chunked API Execution (Bypassing Serverless Timeouts)
Do NOT attempt to run the entire pipeline in one Next.js route.
- **Step 1:** Call `POST /api/generate-core` to create the Project, Version, and raw Episode rows. Return `version_id` and an array of `episode_ids`.
- **Step 2:** Frontend iterates over `episode_ids` and calls `POST /api/analyze-episode?id={id}` for each one sequentially or in safe parallel batches.
- **Step 3:** Frontend calls `POST /api/finalize-version` once all episodes return `200 OK` to generate the `version_analysis` row and mark status as `complete`.

### 2. Concurrency Control on JSONB
When `/api/analyze-episode` runs, Agent 1 (Emotions) and Agent 2 (Cliffhanger) run in parallel via `Promise.all()`. They collect their results in memory. The backend executes exactly **one** SQL `UPDATE` to push all JSONB columns into the `episodes` row at once, preventing DB locks or race conditions.

### 3. Iteration Workflow (The Undo/Redo Loop)
When a user clicks "Apply Optimization":
1. Create a new `version` row referencing the old `version_id` as `parent_version_id`.
2. Duplicate unchanged `episodes` pointing to the new `version_id`.
3. Generate the *new* script for the target episode, run the analysis API, and save it.
4. Atomically update `projects.active_version_id` to the new version.

### 4. Recommended API Endpoints
```text
# Initialization
POST   /api/generate-core                # Creates Project, V1, and base Episodes

# Processing (Async Chunking)
GET    /api/status?version_id={id}       # Polls version.analysis_status
POST   /api/analyze-episode              # Runs NLP + LLM for a single episode ID
POST   /api/finalize-version             # Aggregates radar metrics, marks complete

# State & Rollback
GET    /api/projects/:id                 # Fetches project and ACTIVE version/episodes
POST   /api/iterate                      # Creates V2, duplicates data, applies fix
POST   /api/rollback                     # Updates active_version_id to previous parent
```

---

## Queries & Access Patterns

### Load Full Active Application State (For UI Rendering)
```sql
SELECT 
    v.id AS version_id,
    v.global_characters,
    va.radar_metrics,
    json_agg(
        json_build_object(
            'id', e.id,
            'episode_number', e.episode_number,
            'title', e.title,
            'script_content', e.script_content,
            'script_segments', e.script_segments,
            'metrics', e.hook_and_cliffhanger_metrics,
            'suggestions', e.optimization_suggestions
        ) ORDER BY e.episode_number
    ) AS episodes
FROM projects p
JOIN versions v ON p.active_version_id = v.id
LEFT JOIN version_analysis va ON v.id = va.version_id
LEFT JOIN episodes e ON v.id = e.version_id
WHERE p.id = :project_id
GROUP BY v.id, va.id;
```

### Safely Update Episode JSONB (Backend)
```sql
UPDATE episodes 
SET 
    script_segments = :segments_json,
    hook_and_cliffhanger_metrics = :metrics_json,
    optimization_suggestions = :suggestions_json
WHERE id = :episode_id 
RETURNING id;
```