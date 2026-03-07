import { useQuery } from "@tanstack/react-query";

import {
  getEpisodeExplain,
  type EpisodeExplainResponse,
} from "@/src/lib/api";

export function useEpisodeExplain(episodeId: string | null) {
  return useQuery<EpisodeExplainResponse>({
    queryKey: ["episodeExplain", episodeId],
    queryFn: () => {
      if (!episodeId) throw new Error("Missing episodeId");
      return getEpisodeExplain(episodeId);
    },
    enabled: Boolean(episodeId),
  });
}
