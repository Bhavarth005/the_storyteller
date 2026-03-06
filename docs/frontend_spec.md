# Episodic Intelligence Engine - Frontend Specification

## Purpose
This document defines the Next.js/React frontend architecture. It outlines the technology stack, routing structure, state management, high-impact visual components, and critical client-side infrastructure required to bridge the UI with the asynchronous AI backend while aggressively defending against Vercel serverless timeouts.

---

## 1. Frontend Technology Stack

To handle complex asynchronous state and rich text editing without re-render lag, the frontend will strictly use the following stack:

* **Framework:** Next.js (App Router).
* **State Management:** `Zustand` (for global/local UI state like `currentProject`, `selectedEpisode`, `isDiffModalOpen`).
* **Data Fetching & Caching:** `TanStack Query` (React Query v5). Essential for managing API polling loops, caching episode data, and implementing automatic retries on 504 timeouts.
* **Rich Text Editor:** `Tiptap` (Headless editor). Required to implement Quillbot-style inline text highlighting and hover-tooltips without breaking the React DOM.
* **Charting:** `Recharts` (for the Tension Curve line graphs and Radar charts).
* **Styling:** Tailwind CSS + Shadcn UI (for rapid, accessible component building).

---

## 2. Routing Architecture (Nested App Router)

The application uses nested routing to allow deep-linking, better caching, and partial page loads, preventing massive payload fetches on every click.

* **`/`** : The Dashboard. Displays a grid of existing projects. (Empty state: "Create your first series").
* **`/project/new`** : Initialization interface. Captures `title`, `input_type` (idea vs. draft), and the `raw_story` payload.
* **`/project/[projectId]`** : The Series Overview. Displays the global Story Arc timeline, Weakest Episode Detector, Version History timeline, and series-level Radar chart.
* **`/project/[projectId]/episode/[episodeNumber]`** : The Core Workspace. The specific editor, timeline heatmap, and analytics view for a single script.

---

## 3. Serverless Timeout Defense & State Management (CRITICAL)

Vercel has strict serverless execution limits (10s on Hobby, 60s on Pro). LLM and NLP generation will exceed this. The frontend must never wait on a long-lived POST request.

### Strategy A: The Async Polling Loop (Primary)
When the backend uses a queue (returning `202 Accepted`):
1. User clicks "Generate". UI fires `POST /api/analyze-version`.
2. UI instantly enters a "Processing" state.
3. TanStack Query polls `GET /api/status?version_id={id}` every 3 seconds.

```javascript
// React Query implementation for robust background polling
const { data, status } = useQuery({
  queryKey: ['versionStatus', versionId],
  queryFn: async () => {
    const res = await fetch(`/api/status?version_id=${versionId}`);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  },
  // Poll every 3 seconds ONLY IF the status is pending/processing
  refetchInterval: (query) => 
    (query.state.data?.analysis_status === 'complete' || query.state.data?.analysis_status === 'failed') ? false : 3000,
});
```

### Strategy B: Frontend Orchestrated Chunking (Hackathon Fallback)
If the backend queue architecture fails or cannot be implemented in 48 hours, the frontend MUST orchestrate the chunking to bypass timeouts.
1. Frontend calls `POST /api/generate-core`. Backend returns an array of `episode_ids`.
2. Frontend maps over the array and fires parallel, individual requests using `Promise.allSettled()`.
3. If an individual request throws a `504 Gateway Timeout`, TanStack Query must be configured to retry that specific episode automatically.

```javascript
// Example TanStack Query configuration for Strategy B
const mutation = useMutation({
  mutationFn: (episodeId) => fetch('/api/analyze-episode', { method: 'POST', body: JSON.stringify({ episode_id: episodeId }) }),
  retry: 3, // Crucial: Automatically retry 504 Timeouts
  retryDelay: 2000,
});
```

---

## 4. Core UI Layout & Components (The Workspace)

The `/episode/[episodeNumber]` route is the hero screen of the application.

### A. The Script Editor (Tiptap Implementation)
* **Functionality:** The user reads and edits the `script_content`. 
* **Quillbot-Style Highlights:** The editor parses the `script_segments` array from the backend.
    * **Red Highlight (`bg-red-200`):** Applied to text where `drop_probability > 0.7`.
    * **Yellow Highlight (`bg-yellow-200`):** Applied to text where `emotion === 'neutral'` for > 15s.
* **Interaction:** Clicking a highlighted sentence opens a floating Tiptap bubble menu/tooltip displaying the `optimization_suggestions` for that specific timestamp, alongside the "Explain" logic.

### B. The Episode Timeline Heatmap
* **Visual:** A horizontal progress bar sitting just above the text editor, mapping 0s to 90s.
* **Logic:** Divided into colored blocks based on the `script_segments`. 
  * 🟢 Safe (Low drop probability)
  * 🟡 Warning (Flat emotion detected)
  * 🔴 Drop Risk (High drop probability)
* **Interaction:** Clicking a block on the heatmap scrolls the Tiptap editor to the corresponding sentence.

### C. The Intelligence Dashboard (Sidebar)
* **Tension Curve Animation:** A `Recharts` line graph plotting the `GET /api/episodes/:id/tension-curve` data. 
    * *Demo Feature:* Include a "▶ Play Analysis" button that animates a vertical playhead moving across the X-axis from 0s to 90s.
* **AI Commentary Mode:** A dedicated button that fetches `GET /api/episodes/:id/explain` and displays a human-readable summary of the math (e.g., *"The cliffhanger scored an 8/10 because two physical threats remain unresolved."*)

---

## 5. Series-Level Visualizations (The Overview)

Located at `/project/[projectId]`, these components summarize the 5-8 episodes.

### A. Story Arc Visualizer & Weakest Link
* **Story Arc Stepper:** A vertical timeline mapping the macro narrative (e.g., Ep 1: Hook -> Ep 4: Midpoint Twist -> Ep 8: Resolution).
* **Weakest Episode Detector:** A prominent warning card. 
    * *Logic:* Frontend sorts the `episodes` array by `engagement_score`.
    * *UI:* "⚠ **Weakest Link: Episode 3.** Engagement score is 0.62 due to low emotional variance. [Click to Edit]."

### B. Version Comparison Modal (Diff UI)
* **Trigger:** Clicking "Compare" on the Version History timeline.
* **Data Source:** `GET /api/versions/compare?base_id=v1&target_id=v2`
* **Visual:** A clean, side-by-side metric comparison to prove the iteration engine works.
    * Engagement: `0.64` ➔ `0.78` `<span class="text-green-500">(+0.14)</span>`
    * Cliffhanger: `6` ➔ `8` `<span class="text-green-500">(+2)</span>`

### C. Continuity Tracker (Sidebar)
* **Data Source:** `GET /api/versions/:id/characters`
* **Visuals:** A list of character cards displaying `name`, `description`, and pill-tags for `traits` (e.g., `[paranoid]`, `[brilliant]`). *(Note: Do not attempt to build a D3/React Flow node graph for this; stick to CSS grid cards to save development time).*

---

## 6. Granular UI States (Crucial for UX)

To prevent users from thinking the app has frozen during heavy LLM generation, the UI must have explicit, multi-step states.

### Loading States (Multi-Step Progress)
Instead of a generic spinner, use a progressing checklist to show the AI's work and buy time:
* [✓] Generating Episode Scripts...
* [✓] Extracting Character Bible...
* [↻] Running Sentiment Math on Episode 3/8... *(Active spinner)*
* [ ] Computing Retention Risks...

### Error States & Recovery
* **504 Gateway Timeout (Backend execution limit):** "The AI took too long to analyze this segment." -> Provide a manual `[Retry Episode]` button that triggers the mutation again.
* **Generation Failure:** Standard Shadcn toast notification mapped to the backend's `{ error: { code, message } }` standard format.

### Iteration Workflow (The User Edit Bridge)
When a user manually edits a script or requests an AI rewrite:
1. User types in the Script Editor or clicks "Fix this section".
2. Frontend calls `POST /api/regenerate-episode`.
3. Frontend receives a `new_version_id` with status `processing`.
4. **Crucial UI Step:** The frontend instantly moves the Version Timeline active pointer forward to the new version and re-enters the Polling Loop (`GET /api/status`) for the new `version_id`.
5. Once complete, React Query invalidates the cache, seamlessly refreshing the Editor and Dashboard to show the new data.