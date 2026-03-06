"use client";

import { toast } from "sonner";

import { ApiError } from "@/src/lib/api";

export function showApiErrorToast(
  error: unknown,
  {
    title = "Something went wrong",
    onRetry,
    retryLabel = "Retry",
  }: { title?: string; onRetry?: () => void; retryLabel?: string } = {},
) {
  const apiError = error instanceof ApiError ? error : null;
  const isTimeout = apiError?.status === 504 || apiError?.code === "TIMEOUT";

  const description = apiError?.message ?? "The AI took too long to respond.";

  toast.error(title, {
    description: isTimeout
      ? `${description} You can retry this operation.`
      : description,
    action:
      onRetry && isTimeout
        ? {
            label: retryLabel,
            onClick: onRetry,
          }
        : undefined,
  });
}

