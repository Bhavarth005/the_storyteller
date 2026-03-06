import { create } from "zustand";

type ProjectStore = {
  activeProjectId: string | null;
  selectedEpisode: number | null;
  setActiveProjectId: (projectId: string | null) => void;
  setSelectedEpisode: (episodeNumber: number | null) => void;
  reset: () => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  activeProjectId: null,
  selectedEpisode: null,
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
  setSelectedEpisode: (episodeNumber) => set({ selectedEpisode: episodeNumber }),
  reset: () => set({ activeProjectId: null, selectedEpisode: null }),
}));

