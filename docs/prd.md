# Product Requirements Document (PRD)
**Product Name:** Episodic Intelligence Engine  
**Document Version:** 1.0  
**Phase:** Hackathon Build (48 Hours)  

## 1. Executive Summary
### 1.1 Product Vision
The **Episodic Intelligence Engine** is an AI-powered narrative workspace designed for modern short-form creators. It transforms raw story ideas or unstructured drafts into highly optimized, 90-second episodic vertical video scripts. By combining Generative LLMs with mathematical Natural Language Processing (NLP), the platform acts as a data-driven "Showrunner," predicting audience retention, highlighting emotional flat zones, scoring cliffhangers, and suggesting structural optimizations.

### 1.2 Target Audience
* **Content Creators / TikTokers / YouTubers:** Needing to convert ideas into engaging, multi-part short-form series.
* **Screenwriters / Novelists:** Adapting existing prose into the highly constrained vertical video format.
* **Producers:** Evaluating script drafts for retention viability before spending money on production.

### 1.3 Key Hackathon Value Proposition (Judging Criteria Alignment)
* **Algorithmic Depth:** We do not just use an LLM wrapper. We separate creative generation (LLMs) from mathematical evaluation (Hugging Face NLP) to build deterministic heuristic algorithms (Tension Curves, Drop Probabilities).
* **Practical Usability:** Includes a Git-like version control system, allowing users to safely edit scripts and run "diff" comparisons to prove AI-driven improvements.
* **Explainable AI:** Every score provided by the AI includes a human-readable explanation of the underlying logic, avoiding "black box" frustration.

---

## 2. Core User Journeys



### 2.1 The Genesis Flow (Project Initialization)
1. User lands on the Dashboard and clicks "New Series".
2. User selects input format: **"Brief Idea"** or **"Full Draft"**.
3. User pastes their text and clicks "Generate Engine".
4. The system transitions to a multi-step loading interface while the backend orchestrates the AI pipelines (Macro-Planning → Sequential Script Generation → Parallel NLP Analysis).
5. User is dropped into the Main Workspace for Version 1.

### 2.2 The Optimization Flow (The Iteration Loop)
1. User reviews the **Episode Timeline Heatmap** and identifies a red "Drop Risk" zone in Episode 3.
2. User clicks the red highlighted text in the **Script Editor**.
3. An AI tooltip explains *why* the retention drops (e.g., "Emotional intensity flatlined for 18 seconds") and offers a structural suggestion (e.g., "Insert a visual reveal").
4. User manually edits the text OR clicks "Apply AI Fix".
5. The system creates **Version 2**, runs targeted analysis on Episode 3 only, and updates the UI.
6. User clicks the "Compare" button to view the metric improvements between V1 and V2.

---

## 3. Feature Requirements

### 3.1 Workspace Management
* **Project Dashboard:** Grid view of all series, showing top-level metrics, active version, and last modified date.
* **Linear Version Control:** A timeline UI allowing users to roll back to any previous state. Alternate branching is disabled; history moves in a straight line.
* **Version Diffing:** A modal comparing Engagement Scores, Cliffhanger Ratings, and Retention Stability between two specific versions.

### 3.2 The Intelligence Dashboard (UI/UX)
* **Quillbot-Style Script Editor:** A rich-text editor (Tiptap) that highlights text based on backend ML data (Red = High Drop Risk, Yellow = Emotional Flatline).
* **Narrative Tension Curve:** A dynamic line graph mapping emotional intensity against time (0s to 90s), visually proving where the story peaks and drags.
* **Episode Heatmap:** A horizontal timeline bar above the editor showing safe (green) and risk (red) segments at a glance.
* **Radar Chart:** Series-level visualization mapping `hook_strength`, `suspense_density`, and `retention_stability`.
* **Continuity Sidebar:** A persistent visual ledger tracking the World State (Characters, traits, and "who knows what") to prove the AI's contextual memory across episodes.



### 3.3 The AI Processing Engine (Backend Orchestration)
* **Agent 0 (Story Arc Planner):** Defines global episode goals before script generation to prevent pacing issues.
* **Agent 1 (Narrative Architect):** Generates 150-word scripts sequentially. Must adhere to the `continuity_ledger` (World State) passed from the previous episode.
* **Emotional Forensics (NLP):** Chunks text into 10-second blocks, scoring 28 distinct emotions to derive numerical intensity.
* **Agent 2 (Hook & Cliffhanger Evaluator):** Analyzes the first 10s and last 15s of an episode to extract "Open Loops" and "Threat Levels".
* **Agent 3 (Optimization Critic):** Identifies specific structural fixes for detected risk zones without rewriting the core plot.

---

## 4. System Architecture & Tech Stack



### 4.1 Frontend (Client)
* **Framework:** Next.js (App Router).
* **State Management:** Zustand (Local UI state) + TanStack Query / React Query (Async API polling, caching, and timeout retry logic).
* **Editor:** Tiptap (Headless rich-text editor for custom highlight rendering).
* **Visualization:** Recharts (Tension curves, radar charts).
* **Styling:** Tailwind CSS + Shadcn UI.

### 4.2 Backend (Server)
* **Framework:** Next.js API Routes (Serverless).
* **Database:** PostgreSQL (Neon / Supabase).
* **ORM:** Drizzle ORM.
* **AI Orchestration:** Vercel AI SDK (utilizing `generateObject` with strict Zod schemas).

### 4.3 AI Models
* **Heavy Reasoning LLM:** `gpt-4o` or `gemini-1.5-pro` (Story planning, sequential generation, complex rewriting).
* **Fast Processing LLM:** `gpt-4o-mini` or `gemini-1.5-flash` (Heuristic variable extraction, cliffhanger scoring).
* **NLP Classification:** Hugging Face Inference API (`roberta-base-go_emotions`) for mathematical sentiment analysis.

---

## 5. Non-Functional Requirements & Hackathon Constraints

### 5.1 Serverless Timeout Mitigation (Critical)
* **Issue:** Vercel serverless functions time out after 10-60 seconds. LLM pipelines take longer.
* **Requirement:** The backend must never execute the entire series analysis in a single synchronous API call.
* **Implementation:** * The frontend triggers `POST /api/analyze-version` (which returns a `202 Accepted` instantly).
    * The frontend relies on TanStack Query to poll `GET /api/status?version_id=UUID` every 3 seconds until `analysis_status === 'complete'`.
    * If a background queue is unavailable, the frontend acts as the orchestrator, firing parallel `Promise.allSettled()` requests for individual episodes and automatically retrying on `504` errors.

### 5.2 API Optimization & Rate Limiting
* **Hugging Face Batching:** The backend must batch the 10-second script chunks into a single array payload when calling the NLP model to reduce network latency.
* **Conditional AI Triggers:** Agent 3 (The Optimization Critic) must *only* be invoked if the backend heuristic math detects a `drop_probability > 0.6`. Do not waste tokens on optimizing perfect segments.

### 5.3 Data Model Design Rules
* **JSONB Reliance:** Deep ML analytics (second-by-second sentiment arrays) must be stored in Postgres `JSONB` columns within the `episodes` table to avoid massive join operations and maintain query speed.
* **Immutability:** Once a `version` is marked complete, all associated episodes and metrics are frozen. Iterations must create a new Version record.

---

## 6. Mathematical Heuristics (The "Depth" Formulas)

The backend must calculate the following derived metrics based on raw AI/NLP outputs before sending data to the UI:

* **Emotion Velocity:** $V_t = |Intensity_t - Intensity_{t-1}|$. Low velocity indicates viewer boredom.
* **Tension Curve Math:** Applies a Simple Moving Average (SMA) to raw NLP intensity scores to generate a smooth UI curve. `Tension = (Smoothed Emotion * 0.5) + (Threat Level * 0.3) + (Information Gap * 0.2)`.
* **Engagement Score:** A normalized [0,1] series-level average derived from hook strength, emotional variance, and cliffhanger power.