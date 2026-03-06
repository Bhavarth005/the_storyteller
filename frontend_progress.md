# Frontend Development Progress Tracker
**Project:** Episodic Intelligence Engine
**Stack:** Next.js (App Router), Zustand, TanStack Query v5, Tiptap, Recharts, Tailwind CSS, Shadcn UI

## Phase 1: Tooling & UI Library Setup
- [x] 1.1 Install frontend dependencies (`zustand`, `@tanstack/react-query`, `recharts`, `@tiptap/react`, `@tiptap/starter-kit`, `lucide-react`). *(Installed deps via Bun; `lucide-react` was already present.)*
- [x] 1.2 Initialize Shadcn UI (`bunx --bun shadcn-ui@latest init`) and install base components (button, card, dialog, toast, tabs, progress, skeleton). *(Shadcn was already initialized via `components.json`; installed base UI components. Toast is now `sonner` in Shadcn.)*
- [x] 1.3 Setup TanStack Query provider (`src/components/providers/query-provider.tsx`) and wrap the root layout. *(Added `QueryProvider` and wrapped `app/layout.tsx`.)*
- [x] 1.4 Setup Zustand store (`src/store/useProjectStore.ts`) to track `activeProjectId` and `selectedEpisode`. *(Added `useProjectStore` with setters + reset.)*

## Phase 2: Routing & Layout Scaffolding
- [x] 2.1 Create the Dashboard view (`src/app/page.tsx`) with an empty state and a grid for existing projects. *(Implemented dashboard scaffold + empty state CTA.)*
- [x] 2.2 Create the Initialization view (`src/app/project/new/page.tsx`) with the Idea vs. Draft form. *(Built title + tabs-based idea/draft form scaffold.)*
- [x] 2.3 Create the Main Workspace layout (`src/app/project/[projectId]/layout.tsx`) with the Continuity Sidebar (left) and Intelligence Dashboard (right). *(Added 3-column layout scaffold with sidebar placeholders.)*
- [x] 2.4 Create the Episode Editor view (`src/app/project/[projectId]/episode/[episodeNumber]/page.tsx`). *(Added editor + heatmap placeholder scaffold.)*

## Phase 3: Core API Integration (TanStack Query)
- [x] 3.1 Write API fetcher utility functions in `src/lib/api.ts` matching `api_spec.md`. *(Added typed API client + `ApiError` parsing `{ error: { code, message } }`.)*
- [x] 3.2 Implement `useMutation` for `POST /api/generate-core` and `POST /api/analyze-version` in the New Project form. *(Wired New Series form to trigger core generation then queue analysis.)*
- [x] 3.3 Implement the robust polling hook (`useQuery` with `refetchInterval`) to poll `GET /api/status?version_id={id}`. *(Added `useVersionStatus` hook with conditional 3s polling.)*
- [x] 3.4 Implement data fetching hooks for `GET /api/projects/[id]` and `GET /api/episodes/[id]`. *(Added `useProject` + `useEpisode` hooks.)*

## Phase 4: Data Visualization (Recharts & Heatmaps)
- [x] 4.1 Build `TensionCurveChart.tsx` using Recharts to plot the `tension-curve` X,Y data. *(Added reusable Recharts line chart component.)*
- [x] 4.2 Build `RadarMetricsChart.tsx` using Recharts for the series overview. *(Added reusable Recharts radar chart component.)*
- [x] 4.3 Build `EpisodeHeatmap.tsx`. Map the `script_segments` array to a horizontal colored progress bar (Green/Yellow/Red). *(Implemented clickable segment heatmap with basic risk coloring.)*
- [x] 4.4 Build `ContinuitySidebar.tsx` to render character cards from `GET /api/versions/:id/characters`. *(Implemented character card list scaffold with trait badges.)*

## Phase 5: The Tiptap Script Editor (The Hard Part)
- [x] 5.1 Initialize the Tiptap editor component (`src/components/editor/ScriptEditor.tsx`). *(Added `ScriptEditor` wrapper with StarterKit + change callback.)*
- [x] 5.2 Create a custom Tiptap mark/extension to apply background highlight colors based on `drop_probability` from the API payload. *(Added `RetentionHighlight` mark + optional segment-based highlighting.)*
- [x] 5.3 Implement the Hover Tooltip. When a user clicks a highlighted Tiptap node, display the `optimization_suggestions` and explanation logic. *(Added Tiptap `BubbleMenu` tooltip that appears on highlighted text; renders segment stats + explanation/suggestions with fallbacks.)*
- [x] 5.4 Connect the "Apply AI Fix" button in the tooltip to trigger `POST /api/regenerate-episode`. *(Exposed `onApplyAiFix` from `ScriptEditor` and added `useRegenerateEpisode` mutation hook to call the endpoint.)*

## Phase 6: Polish & Demo Readiness
- [x] 6.1 Implement the multi-step loading screen (Progress checklist for AI generation). *(Added checklist + progress bar to New Series flow, driven by `useVersionStatus` while generation/analysis runs.)*
- [x] 6.2 Implement error handling. Catch 504 Timeouts and trigger Shadcn error toasts with a "Retry" button. *(Mounted global `Toaster` and added `showApiErrorToast` helper; New Series + regenerate mutations now surface errors with optional 504-aware Retry actions.)*
- [x] 6.3 Build the `VersionDiffModal.tsx` comparing metrics from `GET /api/versions/compare`. *(Created `VersionDiffModal` component that calls `compareVersions` and displays key deltas with color-coded improvements.)*
- [x] 6.4 Implement the "Weakest Link" detector component on the series overview page. *(Added `WeakestLink` component and wired it into `/project/[projectId]` to surface the lowest-engagement episode with an Edit CTA.)*
