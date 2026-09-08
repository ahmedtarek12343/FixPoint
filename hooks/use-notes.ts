"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { addNote, deleteNote, updateNote } from "@/lib/actions/notes";
import {
  noteKeys,
  problemNotesQueryOptions,
  userNotesQueryOptions,
} from "@/lib/queries/notes";
import { useToast } from "@/components/ui/toast";

export function useProblemNotes(problemId: string) {
  return useSuspenseQuery(problemNotesQueryOptions(problemId));
}

export function useUserNotes(page = 1) {
  return useSuspenseQuery(userNotesQueryOptions(page));
}

/** Every note mutation affects both this problem's list and the all-notes
 *  page, so both are invalidated from noteKeys.all. */
/** Success toast only: the composer clears and the note lands in a list that is
 *  often scrolled out of view, so the confirmation is worth stating. Failures
 *  render inline under the composer instead. */
export function useAddNote(problemId: string) {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: (content: string) => addNote({ problemId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      success("Note saved");
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (vars: { id: string; content: string }) => updateNote(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      success("Note updated");
    },
    onError: (cause) => error(cause.message),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      success("Note deleted");
    },
    onError: (cause) => error(cause.message),
  });
}
