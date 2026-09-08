"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import {
  replaceProblemTags,
  setPerceivedDifficulty,
  updateProblemMeta,
  upsertProblemFromUrl,
} from "@/lib/data/problems";
import {
  normalizePageArgs,
  toPage,
  type Page,
  type PageArgs,
} from "@/lib/pagination";
import { AttemptStatus, Difficulty, ProblemSource } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Rows are dehydrated to JSON on their way to the client, so these functions
 * return plain serializable shapes rather than Prisma models — a `Date` would
 * silently arrive as a string while the type still claimed `Date`. It also
 * keeps us from shipping columns the UI never renders.
 */
export type ProblemListItem = {
  id: string;
  /** What this user calls it: their override, or the platform's title. */
  title: string;
  url: string;
  source: string;
  /** The platform to show and filter on: the source, or a custom site's name. */
  platform: string;
  difficulty: string | null;
  yourDifficulty: string | null;
  tags: string[];
  attemptCount: number;
  solvedCount: number;
  bestMs: number | null;
  lastAttemptAt: string | null;
  addedAt: string;
};

export type ProblemSort =
  | "recent"
  | "oldest"
  | "title"
  | "fastest"
  | "slowest"
  | "attempts";

export type ProblemFilters = {
  /** Matches the platform title and this user's rename. */
  search?: string;
  /** "LEETCODE", "CODEFORCES", or a custom platform label. */
  platform?: string;
  /** A topic name. Filters to problems carrying that tag. */
  tag?: string;
  /** The platform's rating. */
  difficulty?: string;
  status?: "solved" | "attempted" | "untouched";
  /** Best solve time bucket, in minutes. */
  duration?: "under5" | "5to15" | "15to30" | "over30";
  /** Attempted within the last N days. */
  since?: "7" | "30" | "90";
  sort?: ProblemSort;
};

/** Sorts and filters that depend on a problem's attempts. Prisma cannot order
 *  or filter by an aggregate over a relation, so these force the slower path in
 *  listProblems below. */
function needsDerivedPass(filters: ProblemFilters) {
  return Boolean(
    filters.status ||
      filters.duration ||
      filters.since ||
      (filters.sort &&
        filters.sort !== "recent" &&
        filters.sort !== "oldest")
  );
}

const DURATION_BOUNDS: Record<
  NonNullable<ProblemFilters["duration"]>,
  [number, number]
> = {
  under5: [0, 5 * 60_000],
  "5to15": [5 * 60_000, 15 * 60_000],
  "15to30": [15 * 60_000, 30 * 60_000],
  over30: [30 * 60_000, Number.POSITIVE_INFINITY],
};

export type ProblemFilterOptions = { platforms: string[]; tags: string[] };

/**
 * The values worth offering in the filter menu, built from what this user
 * actually has rather than from a fixed list. A tag nobody has used is not a
 * useful filter, and a custom platform is not knowable in advance at all.
 *
 * One call rather than two: both lists are tiny, they change at the same
 * moments (adding or retagging a problem), and a single round trip keeps them
 * in one cache entry that one invalidation clears.
 */
export async function getProblemFilterOptions(): Promise<ProblemFilterOptions> {
  const user = await requireCurrentUser();
  const inLibrary = { inLibraries: { some: { userId: user.id } } };

  const [rows, tagRows] = await Promise.all([
    prisma.problem.findMany({
      where: inLibrary,
      select: { source: true, platformLabel: true },
      distinct: ["source", "platformLabel"],
    }),
    prisma.tag.findMany({
      where: { problemTags: { some: { problem: inLibrary } } },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const platforms = new Set<string>();
  for (const row of rows) {
    platforms.add(
      row.source === ProblemSource.CUSTOM
        ? (row.platformLabel ?? "Other")
        : row.source
    );
  }

  return {
    platforms: [...platforms].sort(),
    tags: tagRows.map((tag) => tag.name),
  };
}

export async function listProblems(
  args: PageArgs & { filters?: ProblemFilters } = {}
): Promise<Page<ProblemListItem>> {
  const user = await requireCurrentUser();
  const { page, pageSize, skip, take } = normalizePageArgs(args);
  const filters = args.filters ?? {};

  // Problem is a shared catalogue, so the list MUST be scoped to this user's
  // library, or every user sees every problem anyone ever added.
  const where: Prisma.ProblemWhereInput = {
    inLibraries: { some: { userId: user.id } },
  };

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    // Both names, because a renamed problem has to be findable by the name the
    // user gave it as well as by the one the platform gave it.
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      {
        inLibraries: {
          some: {
            userId: user.id,
            customTitle: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (filters.platform) {
    if (filters.platform in ProblemSource && filters.platform !== "CUSTOM") {
      where.source = filters.platform as ProblemSource;
    } else {
      // A custom platform name, or the "Other" bucket for unlabelled ones.
      where.source = ProblemSource.CUSTOM;
      where.platformLabel =
        filters.platform === "Other" ? null : filters.platform;
    }
  }

  if (filters.difficulty && filters.difficulty in Difficulty) {
    where.difficulty = filters.difficulty as Difficulty;
  }

  // Stays in SQL, so filtering by topic keeps the fast paginated path.
  if (filters.tag) {
    where.problemTags = { some: { tag: { name: filters.tag } } };
  }

  const include = {
    problemTags: { include: { tag: true } },
    attempts: {
      where: { userId: user.id },
      select: { status: true, durationMs: true, startedAt: true },
    },
    inLibraries: {
      where: { userId: user.id },
      select: { perceivedDifficulty: true, customTitle: true, addedAt: true },
    },
  } satisfies Prisma.ProblemInclude;

  const derived = needsDerivedPass(filters);

  // Fast path: nothing depends on the attempts, so Postgres does the ordering
  // and the paging and only one page of rows ever leaves the database.
  //
  // Slow path: sorting by best time or filtering by "solved in under 5 minutes"
  // both need an aggregate over a relation, which Prisma cannot express in a
  // where or an orderBy. Those load the matching rows and finish the job in
  // memory. That is fine for a personal library of hundreds of problems; if
  // one ever runs to five figures this becomes a raw SQL query with a lateral
  // join instead.
  const rows = await prisma.problem.findMany({
    where,
    include,
    ...(derived
      ? {}
      : {
          orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
          skip,
          take,
        }),
  });

  const mapped: ProblemListItem[] = rows.map((problem) => {
    const link = problem.inLibraries[0];
    const solved = problem.attempts.filter(
      (attempt) => attempt.status === AttemptStatus.SOLVED
    );

    const lastAttemptAt = problem.attempts.reduce<Date | null>(
      (latest, attempt) =>
        !latest || attempt.startedAt > latest ? attempt.startedAt : latest,
      null
    );

    return {
      id: problem.id,
      title: link?.customTitle ?? problem.title,
      url: problem.url,
      source: problem.source,
      platform:
        problem.source === ProblemSource.CUSTOM
          ? (problem.platformLabel ?? "Other")
          : problem.source,
      difficulty: problem.difficulty,
      yourDifficulty: link?.perceivedDifficulty ?? null,
      tags: problem.problemTags.map((problemTag) => problemTag.tag.name),
      attemptCount: problem.attempts.length,
      solvedCount: solved.length,
      bestMs: solved.reduce<number | null>(
        (best, attempt) =>
          attempt.durationMs !== null &&
          (best === null || attempt.durationMs < best)
            ? attempt.durationMs
            : best,
        null
      ),
      lastAttemptAt: lastAttemptAt?.toISOString() ?? null,
      addedAt: (link?.addedAt ?? problem.createdAt).toISOString(),
    };
  });

  if (!derived) {
    const total = await prisma.problem.count({ where });
    return toPage(mapped, total, page, pageSize);
  }

  let items = mapped;

  if (filters.status === "solved") {
    items = items.filter((item) => item.solvedCount > 0);
  } else if (filters.status === "attempted") {
    // Tried and not yet solved, which is the list worth coming back to.
    items = items.filter(
      (item) => item.attemptCount > 0 && item.solvedCount === 0
    );
  } else if (filters.status === "untouched") {
    items = items.filter((item) => item.attemptCount === 0);
  }

  if (filters.duration) {
    const [min, max] = DURATION_BOUNDS[filters.duration];
    items = items.filter(
      (item) => item.bestMs !== null && item.bestMs >= min && item.bestMs < max
    );
  }

  if (filters.since) {
    const cutoff = Date.now() - Number(filters.since) * 24 * 60 * 60 * 1000;
    items = items.filter(
      (item) =>
        item.lastAttemptAt !== null &&
        new Date(item.lastAttemptAt).getTime() >= cutoff
    );
  }

  const sorted = [...items].sort((a, b) => {
    switch (filters.sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "fastest":
      case "slowest": {
        // Unsolved problems have no time. They sort last either way rather
        // than pretending to be infinitely fast or infinitely slow.
        if (a.bestMs === null && b.bestMs === null) return 0;
        if (a.bestMs === null) return 1;
        if (b.bestMs === null) return -1;
        return filters.sort === "fastest"
          ? a.bestMs - b.bestMs
          : b.bestMs - a.bestMs;
      }
      case "attempts":
        return b.attemptCount - a.attemptCount;
      case "oldest":
        return a.addedAt.localeCompare(b.addedAt);
      default:
        return b.addedAt.localeCompare(a.addedAt);
    }
  });

  return toPage(sorted.slice(skip, skip + take), sorted.length, page, pageSize);
}

export type AddProblemInput = {
  url: string;
  title: string;
  difficulty: string;
  tags: string;
};

export async function addProblem(input: AddProblemInput) {
  const user = await requireUserForWrite();

  const problem = await upsertProblemFromUrl(user.id, input);

  // Deliberately no revalidatePath here: React Query owns this list on the
  // client, and doing both would refetch the same data twice.
  return { id: problem.id };
}

/**
 * Sets the topics on a problem the platform could not tell us about.
 *
 * Scoped to the caller's library: `inLibraries.some` in the lookup means an id
 * alone cannot retag a problem you have never added. That matters more here
 * than elsewhere, because Problem is a shared catalogue row and a bad edit
 * would land in everyone's analytics, not just yours.
 */
export async function setProblemTags(problemId: string, tags: string[]) {
  const user = await requireUserForWrite();

  const problem = await prisma.problem.findFirst({
    where: { id: problemId, inLibraries: { some: { userId: user.id } } },
    select: { id: true },
  });
  if (!problem) throw new Error("Problem not found in your library.");

  const applied = await replaceProblemTags(problemId, tags);
  return { tags: applied };
}

/** Saves the user's own difficulty rating. See setPerceivedDifficulty for why
 *  this writes Problem.difficulty for custom problems and never for the rest. */
export async function rateProblemDifficulty(
  problemId: string,
  difficulty: string
) {
  const user = await requireUserForWrite();

  if (!(difficulty in Difficulty)) {
    throw new Error("That is not a difficulty.");
  }

  return setPerceivedDifficulty(
    user.id,
    problemId,
    difficulty as keyof typeof Difficulty
  );
}

/** Renames a problem for this user, and for a custom problem records which site
 *  it came from. See updateProblemMeta for the shared-catalogue rule. */
export async function editProblemMeta(input: {
  problemId: string;
  title?: string;
  platformLabel?: string | null;
}) {
  const user = await requireUserForWrite();
  const { problemId, ...rest } = input;
  return updateProblemMeta(user.id, problemId, rest);
}
