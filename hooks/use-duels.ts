"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createDuel,
  createDuelFromUrl,
  finishDuel,
  joinDuel,
  startDuel,
} from "@/lib/actions/duels";
import {
  duelHistoryQueryOptions,
  duelKeys,
  duelQueryOptions,
} from "@/lib/queries/duels";
import { problemKeys } from "@/lib/queries/problems";
import { useToast } from "@/components/ui/toast";

export function useDuel(duelId: string) {
  return useSuspenseQuery(duelQueryOptions(duelId));
}

export function useDuelHistory(page = 1) {
  return useSuspenseQuery(duelHistoryQueryOptions(page));
}

export function useCreateDuel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => createDuel(problemId),
    onSuccess: (duel) => {
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      router.push(`/duels/${duel.id}`);
    },
  });
}

export function useCreateDuelFromUrl() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => createDuelFromUrl(url),
    onSuccess: (duel) => {
      // A new problem may have been created, so the problem list is stale too.
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      queryClient.invalidateQueries({ queryKey: problemKeys.all });
      router.push(`/duels/${duel.id}`);
    },
  });
}

export function useJoinDuel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => joinDuel(code),
    onSuccess: (duel) => {
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      router.push(`/duels/${duel.id}`);
    },
  });
}

export function useStartDuel(duelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startDuel(duelId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: duelKeys.detail(duelId) }),
  });
}

export function useFinishDuel(duelId: string) {
  const queryClient = useQueryClient();
  const { success } = useToast();

  return useMutation({
    mutationFn: () => finishDuel(duelId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: duelKeys.detail(duelId) });
      // The rank comes back from the server transaction, which is the only
      // place that can decide it. Saying it immediately beats waiting up to
      // two seconds for the next poll to reveal it.
      if (result) {
        success(
          result.rank === 1 ? "First in. Nice." : "Position " + result.rank
        );
      }
    },
  });
}
