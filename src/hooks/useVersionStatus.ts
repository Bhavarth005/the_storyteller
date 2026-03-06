import { useQuery } from "@tanstack/react-query";

import { getStatus, type GetStatusResponse } from "@/src/lib/api";

export function useVersionStatus(versionId: string | null) {
  return useQuery<GetStatusResponse>({
    queryKey: ["versionStatus", versionId],
    queryFn: () => {
      if (!versionId) throw new Error("Missing versionId");
      return getStatus(versionId);
    },
    enabled: Boolean(versionId),
    refetchInterval: (query) => {
      const status = query.state.data?.analysis_status;
      if (status === "complete" || status === "failed") return false;
      return 3000;
    },
  });
}

