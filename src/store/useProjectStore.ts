import { create } from "zustand";

import type { ProjectDetail } from "@/src/lib/api";

type ProjectStore = {
  // Core identifiers
  activeProjectId: string | null;
  activeVersionId: string | null;
  selectedEpisode: number | null;

  // Full project data populated after fetch
  projectData: ProjectDetail | null;

  // Genesis flow tracking
  episodeIds: string[] | null;

  // Actions
  setActiveProjectId: (projectId: string | null) => void;
  setActiveVersionId: (versionId: string | null) => void;
  setSelectedEpisode: (episodeNumber: number | null) => void;
  setProjectData: (data: ProjectDetail) => void;
  setEpisodeIds: (ids: string[]) => void;

  /** Called after genesis-core returns to seed the store with IDs */
  initFromGenesis: (projectId: string, versionId: string, episodeIds: string[]) => void;

  reset: () => void;
};

const INITIAL: Pick<
  ProjectStore,
  "activeProjectId" | "activeVersionId" | "selectedEpisode" | "projectData" | "episodeIds"
> = {
  activeProjectId: null,
  activeVersionId: null,
  selectedEpisode: null,
  projectData: null,
  episodeIds: null,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...INITIAL,

  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
  setActiveVersionId: (versionId) => set({ activeVersionId: versionId }),
  setSelectedEpisode: (episodeNumber) => set({ selectedEpisode: episodeNumber }),

  setProjectData: (data) =>
    set({
      projectData: data,
      activeProjectId: data.id,
      activeVersionId: data.active_version_id,
    }),

  setEpisodeIds: (ids) => set({ episodeIds: ids }),

  initFromGenesis: (projectId, versionId, episodeIds) =>
    set({
      activeProjectId: projectId,
      activeVersionId: versionId,
      episodeIds,
      projectData: null, // will be populated after full fetch
    }),

  reset: () => set({ ...INITIAL }),
}));

