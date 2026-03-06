import { useQuery } from "@tanstack/react-query";

import { getProject, type ProjectDetail } from "@/src/lib/api";

export function useProject(projectId: string | null) {
  return useQuery<ProjectDetail>({
    queryKey: ["project", projectId],
    queryFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      return getProject(projectId);
    },
    enabled: Boolean(projectId),
  });
}

