import { queryOptions } from "@tanstack/react-query";
import { listDuels } from "@/lib/actions/duels";
import type { DuelView } from "@/lib/data/duels";

export const duelKeys = {
  all: ["duels"] as const,
  detail: (duelId: string) => [...duelKeys.all, "detail", duelId] as const,
  history: (page: number) => [...duelKeys.all, "history", page] as const,
};

/** Unlike the duel detail below, history is a plain server action — it's not
 *  polled, so the action queue costs nothing here. */
export function duelHistoryQueryOptions(page = 1) {
  return queryOptions({
    queryKey: duelKeys.history(page),
    queryFn: () => listDuels({ page }),
  });
}

/**
 * Unlike the other query options in this project, the fetcher here hits a Route
 * Handler instead of a Server Action — see lib/data/duels.ts for why.
 *
 * That means this queryFn only ever runs in the browser (a relative URL has no
 * meaning on the server), so the duel page seeds the cache with
 * `setQueryData` from a direct database read rather than prefetching through
 * these options.
 */
export function duelQueryOptions(duelId: string) {
  return queryOptions({
    queryKey: duelKeys.detail(duelId),
    queryFn: async (): Promise<DuelView> => {
      const response = await fetch(`/api/duels/${duelId}`);
      if (!response.ok) throw new Error("Could not load the duel.");
      return response.json();
    },
    // Poll while something can still change; stop once it's over.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "ACTIVE" ? 2000 : false;
    },
    // The duel view changes on the other player's machine, so this one should
    // never be treated as fresh.
    staleTime: 0,
  });
}
