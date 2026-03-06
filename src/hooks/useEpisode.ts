import { useQuery } from "@tanstack/react-query";

import { getEpisode, type EpisodeDetail } from "@/src/lib/api";

export function useEpisode(episodeId: string | null) {
  return useQuery<EpisodeDetail>({
    queryKey: ["episode", episodeId],
    queryFn: () => {
      if (!episodeId) throw new Error("Missing episodeId");
      return getEpisode(episodeId);
    },
    enabled: Boolean(episodeId),
  });
}

