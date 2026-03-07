import { useQuery } from "@tanstack/react-query";

import {
  getProjectVersions,
  type GetProjectVersionsResponse,
} from "@/src/lib/api";

export function useProjectVersions(projectId: string | null) {
  return useQuery<GetProjectVersionsResponse>({
    queryKey: ["projectVersions", projectId],
    queryFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      return getProjectVersions(projectId);
    },
    enabled: Boolean(projectId),
  });
}
