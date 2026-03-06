import { useMutation } from "@tanstack/react-query";

import {
  regenerateEpisode,
  type RegenerateEpisodeRequest,
  type RegenerateEpisodeResponse,
} from "@/src/lib/api";
import { showApiErrorToast } from "@/src/lib/toast";

export function useRegenerateEpisode() {
  return useMutation<RegenerateEpisodeResponse, Error, RegenerateEpisodeRequest>(
    {
      mutationFn: regenerateEpisode,
      onError: (error, variables, context) => {
        showApiErrorToast(error, {
          title: "Episode regeneration failed",
          onRetry: () => {
            // Let the caller decide whether to retry with the same payload.
          },
        });
      },
    },
  );
}

