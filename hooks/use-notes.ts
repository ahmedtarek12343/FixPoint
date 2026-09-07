"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { addNote, deleteNote, updateNote } from "@/lib/actions/notes";
import {
  noteKeys,
  problemNotesQueryOptions,
  userNotesQueryOptions,
} from "@/lib/queries/notes";

export function useProblemNotes(problemId: string) {
  return useSuspenseQuery(problemNotesQueryOptions(problemId));
}

export function useUserNotes(page = 1) {
  return useSuspenseQuery(userNotesQueryOptions(page));
}

/** Every note mutation affects both this problem's list and the all-notes
 *  page, so both are invalidated from noteKeys.all. */
export function useAddNote(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => addNote({ problemId, content }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: noteKeys.all }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; content: string }) => updateNote(vars),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: noteKeys.all }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: noteKeys.all }),
  });
}
