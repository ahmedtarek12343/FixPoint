"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { saveWhiteboard, type WhiteboardScene } from "@/lib/actions/whiteboard";
import { whiteboardQueryOptions } from "@/lib/queries/whiteboard";
import { useToast } from "@/components/ui/toast";

export function useWhiteboard(problemId: string) {
  return useSuspenseQuery(whiteboardQueryOptions(problemId));
}

/**
 * Deliberately does NOT invalidate its own query on success: the editor holds
 * the authoritative scene while it's open, and refetching would hand it back
 * stale data mid-draw.
 */
export function useSaveWhiteboard(problemId: string) {
  const { error } = useToast();

  return useMutation({
    mutationFn: (scene: WhiteboardScene) =>
      saveWhiteboard({ problemId, scene }),
    // Errors only. Autosave fires on a 1.5s debounce while drawing, so a
    // success toast would be a strobe light. A failure means the work on
    // screen is not saved anywhere, and that must never be silent.
    onError: (cause) => error("Whiteboard not saved. " + cause.message),
  });
}
