# AI Architecture & Agent Specification

## Purpose
Defines the AI ecosystem for the Episodic Intelligence Engine. This specification outlines the division of labor between generative LLMs, analytical NLP models, and deterministic backend mathematics to ensure high algorithmic depth and robust, serverless-friendly execution.

---

## 1. Model Roster & Division of Logic

To avoid the "GPT Wrapper" penalty, the system strictly separates creative generation from mathematical evaluation.

| Designation | Model / Tool | Role in Pipeline |
| :--- | :--- | :--- |
| **Heavy LLM** | `gpt-4o` / `gemini-1.5-pro` | Macro-planning, sequential script generation, maintaining the World State (Continuity Ledger). |
| **Fast LLM** | `gpt-4o-mini` / `gemini-1.5-flash`| Rapid evaluation of hooks/cliffhangers and generating targeted script optimizations. |
| **NLP Model** | `roberta-base-go_emotions` (via API) | Deterministic sentiment classification. Returns raw emotional probabilities across 28 labels. |
| **Heuristic Engine**| Next.js Backend (TypeScript) | Calculates moving averages, emotion velocity, and final tension curves from AI-extracted variables. |

---

## 2. Agent Specifications & JSON Contracts

### Agent 0: The Story Arc Planner
* **Role:** Establishes the macro-structure before any scripts are written. Prevents pacing issues.
* **Assigned LLM:** Heavy LLM
* **Input from Backend:** `raw_story` and `input_type`
* **Expected Output:**
    ```json
    {
      "global_characters": [
        { "name": "string", "description": "string", "traits": ["string"] }
      ],
      "episode_goals": [
        { "episode_number": 1, "narrative_goal": "Introduce the primary mystery" },
        { "episode_number": 2, "narrative_goal": "Escalate the physical threat" }
      ]
    }
    ```

### Agent 1: The Narrative Architect (State-Aware)
* **Role:** Writes the 90-second script for a specific episode while strictly adhering to the World State.
* **Assigned LLM:** Heavy LLM
* **Input from Backend:** * `episode_goal` (From Agent 0)
    * `previous_continuity_ledger` (The World State at the end of the previous episode)
* **Expected Output:**
    ```json
    {
      "script_content": "string (~150 words)",
      "continuity_ledger": {
        "information_state": [{"fact": "string", "known_by": ["string"], "unknown_by": ["string"]}],
        "relationship_state": [{"entities": ["string", "string"], "dynamic": "string"}]
      }
    }
    ```

### Model 1: Emotional Forensics (NLP) & Backend Math
* **Role:** Generates the raw data for the Tension Curve.
* **Input to Model:** Array of 10-second script chunks.
* **Output from Model:** Array of emotion labels and intensity scores (e.g., `{"emotion": "fear", "intensity": 0.8}`).
* **Backend Heuristic Actions:**
    1.  **Velocity Calculation:** The backend computes the shift in emotion: $V_t = |I_t - I_{t-1}|$ (where $I$ is intensity).
    2.  **Data Smoothing:** Applies a 3-point Simple Moving Average to the intensity scores to prevent jagged, unreadable UI graphs.
    3.  **Risk Detection:** If moving average intensity $< 0.3$ for two consecutive chunks, backend flags `drop_probability > 0.7`.

### Agent 2: Hook & Cliffhanger Evaluator
* **Role:** Analyzes entry and exit points for retention markers.
* **Assigned LLM:** Fast LLM
* **Input from Backend:** `first_10_sec_text` and `last_15_sec_text`.
* **Expected Output:**
    ```json
    {
      "hook": { "pattern": "curiosity_gap", "novelty_score": 0.8 },
      "cliffhanger": { "open_loops": 2, "threat_level": 0.7, "logic": "string" }
    }
    ```
* **Backend Heuristic Action:** Combines outputs into a normalized $0.0 - 1.0$ score: $S = (O \times 0.4) + (T \times 0.6)$ (where $O$ is normalized open loops and $T$ is threat level).

### Agent 3: The Optimization Critic
* **Role:** Identifies exact narrative flaws and suggests structural pattern interrupts.
* **Assigned LLM:** Heavy LLM
* **Trigger Condition:** Only called by the backend if a chunk's `drop_probability > 0.6` or `cliffhanger_score < 5`.
* **Input from Backend:** `script_content` and `high_risk_timestamps`.
* **Expected Output:**
    ```json
    {
      "issues": [
        { "type": "low_tension", "target_time_sec": 45, "severity": "high" }
      ],
      "optimization_suggestions": [
        { "target_time_sec": 45, "suggestion": "Insert a visual reveal to break the emotional flat zone." }
      ]
    }
    ```

---

## 3. Execution Pipeline (Safe Async Flow)

To ensure UI responsiveness and bypass serverless timeouts, the Next.js backend orchestrates the AI via a chunked pipeline:

**Phase 1: Planning (Synchronous)**
1. Backend calls Agent 0 to generate `episode_goals` and `global_characters`.
2. Backend returns success to Frontend, which renders the series outline.

**Phase 2: Sequential Generation (Background/Batched)**
1. Backend calls Agent 1 for Episode 1. Saves script and `continuity_ledger`.
2. Backend passes Episode 1's ledger to Agent 1 to generate Episode 2. 
3. *Performance Note:* This must be executed sequentially to maintain state. The UI should display a progress bar ("Generating 2 of 8...").

**Phase 3: Parallel Analytics (Chunked API Calls)**
1. Once scripts are generated, the Frontend triggers `/api/analyze-episode?id=N` for each episode simultaneously.
2. For each episode, the Backend batches text chunks and calls the NLP Model once. 
3. Concurrently, the Backend calls Agent 2 for the endings. 
4. The Backend applies the Heuristic Smoothing Math. If risks are detected, it triggers Agent 3.
5. All analytical JSONB data is saved to the database in a single `UPDATE` transaction per episode.