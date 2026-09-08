import { queryOptions } from "@tanstack/react-query";
import {
  getProblemFilterOptions,
  listProblems,
  type ProblemFilters,
} from "@/lib/actions/problems";

export const EMPTY_FILTERS: ProblemFilters = {};

/**
 * Filters go into the query key, so each combination is its own cache entry and
 * stepping back to one you have already seen is instant.
 *
 * They are normalised first: `{ search: "" }` and `{}` describe the same list,
 * and key order matters to React Query's hashing, so an un-normalised object
 * would produce two entries for one result and quietly double the fetching.
 */
function normalizeFilters(filters: ProblemFilters): ProblemFilters {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(entries) as ProblemFilters;
}

export const problemKeys = {
  all: ["problems"] as const,
  list: (page: number, filters: ProblemFilters = EMPTY_FILTERS) =>
    [...problemKeys.all, "list", page, normalizeFilters(filters)] as const,
  filterOptions: () => [...problemKeys.all, "filter-options"] as const,
};

/**
 * Shared by the server prefetch and the client hook so the key and the fetcher
 * cannot drift apart. No "use client" here on purpose: this module has to be
 * importable from both sides.
 */
export function problemsQueryOptions(
  page = 1,
  filters: ProblemFilters = EMPTY_FILTERS
) {
  const normalized = normalizeFilters(filters);

  return queryOptions({
    queryKey: problemKeys.list(page, normalized),
    // Wrapped in an arrow rather than passed as `queryFn: listProblems`:
    // React Query calls queryFn with a context object, and handing that to a
    // server action would try to send it across the wire as an argument.
    queryFn: () => listProblems({ page, filters: normalized }),
  });
}

/** The platforms and topics this user has problems under. Changes only when a
 *  problem is added or retagged, so it is cached far longer than the list. */
export function problemFilterOptionsQueryOptions() {
  return queryOptions({
    queryKey: problemKeys.filterOptions(),
    queryFn: () => getProblemFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });
}
