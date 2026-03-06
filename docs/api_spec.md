# Episodic Intelligence Engine - API Specification

## Purpose
This document defines the complete REST API endpoints for the Next.js backend. The API is divided into **Workspace Management (CRUD)**, **AI Orchestration Pipelines**, and **UI/Demo Dashboards**. It is built to support asynchronous processing, linear version control, and granular explainability.

## Base Convention & Error Handling
- All endpoints are prefixed with `/api`.
- All POST/PATCH requests expect and return `application/json`.
- Standard HTTP status codes are used (`200 OK`, `201 Created`, `202 Accepted`, `204 No Content`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

**Standard Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_VERSION_ID",
    "message": "The requested version could not be found or has been deleted."
  }
}
```

---

## 1. Projects (Workspace CRUD)

### `GET /api/projects`
**Description:** Fetches a lightweight list of all projects for the user dashboard.
* **Response (200 OK):**
  ```json
  {
    "projects": [
      {
        "id": "proj-uuid-1",
        "title": "The Neon Detective",
        "input_type": "idea",
        "active_version_id": "vers-uuid-2",
        "created_at": "2026-03-05T10:00:00Z",
        "updated_at": "2026-03-05T14:48:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
  ```

### `GET /api/projects/:id`
**Description:** Fetches the complete hierarchical state of the active version. This is the heavy payload used to render the main editor.
* **Response (200 OK):**
  ```json
  {
    "id": "proj-uuid-1",
    "title": "The Neon Detective",
    "input_type": "idea",
    "original_raw_story": "A cyberpunk detective discovers a body that looks exactly like him...",
    "active_version_id": "vers-uuid-2",
    "version_data": {
      "id": "vers-uuid-2",
      "analysis_status": "complete",
      "commit_message": "Applied AI Pacing Fix to Ep 3",
      "global_characters": [
        { "name": "Detective Chen", "description": "Weary cyber-detective", "traits": ["cynical", "observant"] }
      ],
      "episodes": [
        {
          "id": "ep-uuid-1",
          "episode_number": 1,
          "title": "The Mirror Corps",
          "script_content": "Chen stood in the rain. The body at his feet wore his face...",
          "script_segments": [
            { "start_sec": 0, "end_sec": 10, "text": "Chen stood in the rain.", "emotion": "neutral", "drop_probability": 0.05, "engagement_score": 0.88 }
          ],
          "hook_and_cliffhanger_metrics": {
            "hook_strength": 0.85,
            "cliffhanger_score": 8,
            "open_loops": 2,
            "threat_level": 0.8
          },
          "optimization_suggestions": [],
          "character_appearances": ["Detective Chen"],
          "continuity_notes": "Chen discovers the clone. Police do not know."
        }
      ],
      "version_analysis": {
        "overall_engagement_score": 0.78,
        "average_cliffhanger": 7.5,
        "emotional_variance_index": 0.64,
        "radar_metrics": {
          "hook_strength": 0.81,
          "suspense_density": 0.90,
          "retention_stability": 0.73
        }
      }
    }
  }
  ```

### `PATCH /api/projects/:id`
**Description:** Updates project metadata (e.g., renaming the series).
* **Request Body:**
  ```json
  {
    "title": "The Cyberpunk Detective"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "proj-uuid-1",
    "title": "The Cyberpunk Detective",
    "updated_at": "2026-03-05T15:00:00Z"
  }
  ```

### `DELETE /api/projects/:id`
**Description:** Permanently deletes a project. Cascades to delete all associated versions and analytics.
* **Response (204 No Content)**

---

## 2. Versions & Iteration (State Control)

### `GET /api/projects/:id/versions`
**Description:** Fetches the linear version history for a project timeline UI.
* **Response (200 OK):**
  ```json
  {
    "versions": [
      {
        "id": "vers-uuid-2",
        "parent_version_id": "vers-uuid-1",
        "commit_message": "Applied AI Pacing Fix to Ep 3",
        "analysis_status": "complete",
        "created_at": "2026-03-05T15:30:00Z"
      },
      {
        "id": "vers-uuid-1",
        "parent_version_id": null,
        "commit_message": "Initial Generation",
        "analysis_status": "complete",
        "created_at": "2026-03-05T14:48:00Z"
      }
    ]
  }
  ```

### `GET /api/versions/:id`
**Description:** Fetches the full data payload for a specific historical version (allows users to preview an old version before rolling back).
* **Response (200 OK):** *(Returns the exact same `version_data` object found in `GET /api/projects/:id`)*

### `DELETE /api/versions/:id`
**Description:** Deletes a specific version (and its episodes/analytics via cascade) to clean up unwanted drafts. Cannot delete the `active_version_id`.
* **Response (204 No Content)**

### `POST /api/rollback`
**Description:** Changes the `active_version_id` pointer on a project to revert the workspace to a previous state.
* **Request Body:**
  ```json
  {
    "project_id": "proj-uuid-1",
    "target_version_id": "vers-uuid-1"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "active_version_id": "vers-uuid-1"
  }
  ```

---

## 3. Episodes & Explainability

### `GET /api/episodes/:id`
**Description:** Fetches a single episode's complete script and inline segment data.
* **Response (200 OK):**
  ```json
  {
    "id": "ep-uuid-1",
    "version_id": "vers-uuid-2",
    "episode_number": 1,
    "title": "The Mirror Corps",
    "script_content": "Chen stood in the rain...",
    "script_segments": [
      { "start_sec": 0, "end_sec": 10, "text": "Chen stood in the rain.", "emotion": "neutral", "drop_probability": 0.05, "engagement_score": 0.88 }
    ],
    "hook_and_cliffhanger_metrics": {
      "hook_strength": 0.85,
      "cliffhanger_score": 8,
      "open_loops": 2,
      "threat_level": 0.8
    },
    "optimization_suggestions": []
  }
  ```

### `GET /api/episodes/:id/explain`
**Description:** Provides the human-readable logic behind the AI's mathematical scores for UI tooltips.
* **Response (200 OK):**
  ```json
  {
    "episode_id": "ep-uuid-1",
    "explanations": {
      "cliffhanger_logic": "Two unresolved threats remain open regarding the identity of the clone and the approaching sirens.",
      "retention_risk_reason": "Emotional intensity stayed below 0.3 for 18 consecutive seconds during the alleyway walk.",
      "optimization_rationale": "Inserting a visual reveal of the bloody knife here breaks the detected emotional flatline and re-engages the viewer."
    }
  }
  ```

---

## 4. AI Processing Pipelines (Orchestration)

### `POST /api/generate-core`
**Description:** The primary creation pipeline. Initializes a new project and generates the raw episodic scripts sequentially.
* **Request Body:**
  ```json
  {
    "title": "The Neon Detective",
    "input_type": "idea", 
    "raw_story": "A cyberpunk detective discovers a body that looks exactly like him..."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "project_id": "proj-uuid-1",
    "version_id": "vers-uuid-1",
    "analysis_status": "pending",
    "message": "Core generation complete. Trigger /api/analyze-version next."
  }
  ```

### `POST /api/analyze-version`
**Description:** Triggers the background parallel NLP and LLM analysis for all episodes. Returns immediately to prevent serverless timeouts. Backend will utilize a background queue/worker.
* **Request Body:**
  ```json
  {
    "version_id": "vers-uuid-1"
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "message": "Analysis queued successfully. Poll /api/status?version_id=vers-uuid-1 for completion.",
    "version_id": "vers-uuid-1"
  }
  ```

### `POST /api/analyze-episode` (Internal / Retry Endpoint)
**Description:** Analyzes a single episode. Primarily used internally by the worker queue, but exposed for targeted retries if a specific episode's analysis fails.
* **Request Body:**
  ```json
  {
    "episode_id": "ep-uuid-1"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "episode_id": "ep-uuid-1",
    "status": "success"
  }
  ```

### `GET /api/status?version_id={uuid}`
**Description:** Polling endpoint for the frontend to check background processing progress.
* **Response (200 OK):**
  ```json
  {
    "version_id": "vers-uuid-1",
    "analysis_status": "complete" 
  }
  ```

### `POST /api/regenerate-episode`
**Description:** Explicitly triggers an Agentic rewrite of a specific episode based on instructions. Automatically creates a new version, copies unchanged episodes, and queues analysis.
* **Request Body:**
  ```json
  {
    "project_id": "proj-uuid-1",
    "parent_version_id": "vers-uuid-1",
    "episode_id": "ep-uuid-1",
    "instruction": "Rewrite the ending to make the cliffhanger more suspenseful by having the clone open its eyes."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "new_version_id": "vers-uuid-2",
    "new_episode_id": "ep-uuid-1-new",
    "analysis_status": "processing",
    "message": "Regeneration and analysis queued."
  }
  ```

---

## 5. UI & Demo Dashboards (The "Wow" Factor)

### `GET /api/episodes/:id/tension-curve`
**Description:** Returns a clean array of X,Y coordinates for the frontend to instantly plot the narrative tension line graph.
* **Response (200 OK):**
  ```json
  {
    "episode_id": "ep-uuid-1",
    "curve": [
      { "time_sec": 0, "tension": 0.5 },
      { "time_sec": 10, "tension": 0.65 },
      { "time_sec": 20, "tension": 0.4 },
      { "time_sec": 30, "tension": 0.85 },
      { "time_sec": 40, "tension": 0.90 }
    ]
  }
  ```

### `GET /api/versions/:id/analytics`
**Description:** Fetches the lightweight radar metrics and health scores for the dashboard summary without loading script text.
* **Response (200 OK):**
  ```json
  {
    "version_id": "vers-uuid-2",
    "overall_engagement_score": 0.78,
    "average_cliffhanger": 7.5,
    "emotional_variance_index": 0.64,
    "radar_metrics": {
      "hook_strength": 0.81,
      "retention_stability": 0.73,
      "suspense_density": 0.90
    }
  }
  ```

### `GET /api/versions/compare?base_id={uuid}&target_id={uuid}`
**Description:** Calculates the delta between two versions for a highly visual "Before & After" UI.
* **Response (200 OK):**
  ```json
  {
    "base_version_id": "vers-uuid-1",
    "target_version_id": "vers-uuid-2",
    "deltas": {
      "overall_engagement": "+0.12",
      "average_cliffhanger": "+1.5",
      "retention_stability": "-0.05"
    }
  }
  ```

### `GET /api/versions/:id/characters`
**Description:** Fetches the global character state for a specific version to populate the Continuity Tracker sidebar.
* **Response (200 OK):**
  ```json
  {
    "version_id": "vers-uuid-2",
    "characters": [
      {
        "name": "Detective Chen",
        "description": "Weary cyber-detective",
        "traits": ["cynical", "observant"]
      },
      {
        "name": "The Clone",
        "description": "An exact genetic match to Chen",
        "traits": ["deceased", "mysterious"]
      }
    ]
  }
  ```