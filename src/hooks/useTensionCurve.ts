import { useQuery } from "@tanstack/react-query";

import {
  getEpisodeTensionCurve,
  type TensionCurveResponse,
} from "@/src/lib/api";

export function useTensionCurve(episodeId: string | null) {
  return useQuery<TensionCurveResponse>({
    queryKey: ["tensionCurve", episodeId],
    queryFn: () => {
      if (!episodeId) throw new Error("Missing episodeId");
      return getEpisodeTensionCurve(episodeId);
    },
    enabled: Boolean(episodeId),
  });
}
