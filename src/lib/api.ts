export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(args: { status: number; message: string; code?: string }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
  }
}

async function parseJsonSafely(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.ok) {
    // Handle 204 No Content (e.g. DELETE responses)
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const payload = (await parseJsonSafely(res)) as ApiErrorPayload | null;
  const message =
    payload?.error?.message ?? `Request failed with status ${res.status}`;
  const code = payload?.error?.code;

  throw new ApiError({ status: res.status, message, code });
}

// ---- Projects (Workspace CRUD)
export type ProjectListItem = {
  id: string;
  title: string;
  input_type: "idea" | "draft";
  active_version_id: string;
  created_at: string;
  updated_at: string;
};

export type GetProjectsResponse = {
  projects: ProjectListItem[];
  pagination: { page: number; limit: number; total: number };
};

export function getProjects() {
  return fetchJson<GetProjectsResponse>("/api/projects");
}

export type ProjectDetailEpisode = {
  id: string;
  episode_number: number;
  title: string;
  script_content: string;
  script_segments: Array<{
    start_sec: number;
    end_sec: number;
    text: string;
    emotion: string;
    drop_probability: number;
    engagement_score: number;
  }>;
  hook_and_cliffhanger_metrics: {
    hook_strength: number;
    cliffhanger_score: number;
    open_loops: number;
    threat_level: number;
  };
  optimization_suggestions: unknown[];
  character_appearances: string[];
  continuity_notes: string;
};

export type ProjectDetail = {
  id: string;
  title: string;
  input_type: "idea" | "draft";
  original_raw_story: string;
  active_version_id: string;
  version_data: {
    id: string;
    analysis_status: "pending" | "processing" | "complete" | "failed";
    commit_message: string | null;
    global_characters: Array<{
      name: string;
      description: string;
      traits: string[];
    }>;
    episodes: ProjectDetailEpisode[];
    version_analysis: {
      overall_engagement_score: number;
      average_cliffhanger: number;
      emotional_variance_index: number;
      radar_metrics: {
        hook_strength: number;
        suspense_density: number;
        retention_stability: number;
      };
    };
  };
};

export function getProject(projectId: string) {
  return fetchJson<ProjectDetail>(`/api/projects/${projectId}`);
}

export type PatchProjectRequest = { title: string };
export type PatchProjectResponse = {
  id: string;
  title: string;
  updated_at: string;
};

export function patchProject(projectId: string, body: PatchProjectRequest) {
  return fetchJson<PatchProjectResponse>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProject(projectId: string) {
  return fetchJson<void>(`/api/projects/${projectId}`, { method: "DELETE" });
}

// ---- Versions & Iteration
export type VersionListItem = {
  id: string;
  parent_version_id: string | null;
  commit_message: string | null;
  analysis_status: "pending" | "processing" | "complete" | "failed";
  created_at: string;
};

export type GetProjectVersionsResponse = { versions: VersionListItem[] };

export function getProjectVersions(projectId: string) {
  return fetchJson<GetProjectVersionsResponse>(`/api/projects/${projectId}/versions`);
}

export function getVersion(versionId: string) {
  return fetchJson<ProjectDetail["version_data"]>(`/api/versions/${versionId}`);
}

export function deleteVersion(versionId: string) {
  return fetchJson<void>(`/api/versions/${versionId}`, { method: "DELETE" });
}

export type RollbackRequest = { project_id: string; target_version_id: string };
export type RollbackResponse = { status: "success"; active_version_id: string };

export function rollbackVersion(body: RollbackRequest) {
  return fetchJson<RollbackResponse>("/api/rollback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- Episodes & Explainability
export type EpisodeDetail = {
  id: string;
  version_id: string;
  episode_number: number;
  title: string;
  script_content: string;
  script_segments: ProjectDetailEpisode["script_segments"];
  hook_and_cliffhanger_metrics: ProjectDetailEpisode["hook_and_cliffhanger_metrics"];
  optimization_suggestions: unknown[];
};

export function getEpisode(episodeId: string) {
  return fetchJson<EpisodeDetail>(`/api/episodes/${episodeId}`);
}

export type PatchEpisodeRequest = { script_content: string };

export function patchEpisode(episodeId: string, body: PatchEpisodeRequest) {
  return fetchJson<{ id: string; updated: boolean }>(`/api/episodes/${episodeId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type EpisodeExplainResponse = {
  episode_id: string;
  explanations: {
    cliffhanger_logic: string;
    retention_risk_reason: string;
    optimization_rationale: string;
  };
};

export function getEpisodeExplain(episodeId: string) {
  return fetchJson<EpisodeExplainResponse>(`/api/episodes/${episodeId}/explain`);
}

// ---- AI Pipelines
export type GenerateCoreRequest = {
  title: string;
  input_type: "idea" | "draft";
  raw_story: string;
  episode_count?: number;
};

export type GenerateCoreResponse = {
  project_id: string;
  version_id: string;
  episode_ids: string[];
  analysis_status: "pending" | "processing" | "complete" | "failed";
  message: string;
};

export function generateCore(body: GenerateCoreRequest) {
  return fetchJson<GenerateCoreResponse>("/api/generate-core", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type AnalyzeVersionRequest = { version_id: string };
export type AnalyzeVersionResponse = { message: string; version_id: string };

export function analyzeVersion(body: AnalyzeVersionRequest) {
  return fetchJson<AnalyzeVersionResponse>("/api/analyze-version", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type AnalyzeEpisodeRequest = { episode_id: string };
export type AnalyzeEpisodeResponse = { episode_id: string; status: "success" };

export function analyzeEpisode(body: AnalyzeEpisodeRequest) {
  return fetchJson<AnalyzeEpisodeResponse>("/api/analyze-episode", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type GetStatusResponse = {
  version_id: string;
  analysis_status: "pending" | "processing" | "complete" | "failed";
};

export function getStatus(versionId: string) {
  return fetchJson<GetStatusResponse>(`/api/status?version_id=${encodeURIComponent(versionId)}`);
}

export type RegenerateEpisodeRequest = {
  project_id: string;
  parent_version_id: string;
  episode_id: string;
  instruction: string;
};

export type RegenerateEpisodeResponse = {
  new_version_id: string;
  new_episode_id: string;
  analysis_status: "pending" | "processing" | "complete" | "failed";
  message: string;
};

export function regenerateEpisode(body: RegenerateEpisodeRequest) {
  return fetchJson<RegenerateEpisodeResponse>("/api/regenerate-episode", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- UI & Demo Dashboards
export type TensionCurveResponse = {
  episode_id: string;
  curve: Array<{ time_sec: number; tension: number }>;
};

export function getEpisodeTensionCurve(episodeId: string) {
  return fetchJson<TensionCurveResponse>(`/api/episodes/${episodeId}/tension-curve`);
}

export type VersionAnalyticsResponse = {
  version_id: string;
  overall_engagement_score: number;
  average_cliffhanger: number;
  emotional_variance_index: number;
  radar_metrics: {
    hook_strength: number;
    retention_stability: number;
    suspense_density: number;
  };
};

export function getVersionAnalytics(versionId: string) {
  return fetchJson<VersionAnalyticsResponse>(`/api/versions/${versionId}/analytics`);
}

export type CompareVersionsResponse = {
  base_version_id: string;
  target_version_id: string;
  deltas: {
    overall_engagement: string;
    average_cliffhanger: string;
    retention_stability: string;
  };
};

export function compareVersions(baseId: string, targetId: string) {
  return fetchJson<CompareVersionsResponse>(
    `/api/versions/compare?base_id=${encodeURIComponent(baseId)}&target_id=${encodeURIComponent(targetId)}`,
  );
}

export type VersionCharactersResponse = {
  version_id: string;
  characters: Array<{
    name: string;
    description: string;
    traits: string[];
  }>;
};

export function getVersionCharacters(versionId: string) {
  return fetchJson<VersionCharactersResponse>(`/api/versions/${versionId}/characters`);
}

// ---- Finalize Version
export type FinalizeVersionRequest = { version_id: string };
export type FinalizeVersionResponse = {
  version_id: string;
  analysis_status: "complete";
};

export function finalizeVersion(body: FinalizeVersionRequest) {
  return fetchJson<FinalizeVersionResponse>("/api/finalize-version", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

