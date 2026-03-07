import { useQuery } from "@tanstack/react-query";

import {
  getVersionAnalytics,
  type VersionAnalyticsResponse,
} from "@/src/lib/api";

export function useVersionAnalytics(versionId: string | null) {
  return useQuery<VersionAnalyticsResponse>({
    queryKey: ["versionAnalytics", versionId],
    queryFn: () => {
      if (!versionId) throw new Error("Missing versionId");
      return getVersionAnalytics(versionId);
    },
    enabled: Boolean(versionId),
  });
}
