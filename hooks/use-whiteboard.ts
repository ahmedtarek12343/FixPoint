"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { saveWhiteboard, type WhiteboardScene } from "@/lib/actions/whiteboard";
import { whiteboardQueryOptions } from "@/lib/queries/whiteboard";

export function useWhiteboard(problemId: string) {
  return useSuspenseQuery(whiteboardQueryOptions(problemId));
}

/**
 * Deliberately does NOT invalidate its own query on success: the editor holds
 * the authoritative scene while it's open, and refetching would hand it back
 * stale data mid-draw.
 */
export function useSaveWhiteboard(problemId: string) {
  return useMutation({
    mutationFn: (scene: WhiteboardScene) =>
      saveWhiteboard({ problemId, scene }),
  });
}
