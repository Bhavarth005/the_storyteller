import { useQuery } from "@tanstack/react-query";

import {
  getVersionCharacters,
  type VersionCharactersResponse,
} from "@/src/lib/api";

export function useVersionCharacters(versionId: string | null) {
  return useQuery<VersionCharactersResponse>({
    queryKey: ["versionCharacters", versionId],
    queryFn: () => {
      if (!versionId) throw new Error("Missing versionId");
      return getVersionCharacters(versionId);
    },
    enabled: Boolean(versionId),
  });
}
