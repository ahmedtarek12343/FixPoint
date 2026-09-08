import { prisma } from "@/lib/prisma";
import { parseProblemUrl } from "@/lib/problem-url";
import { fetchProblemMetadata } from "@/lib/data/problem-metadata";
import {
  MAX_PLATFORM_LABEL_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";
import { Difficulty, ProblemSource } from "@/generated/prisma/enums";

export type UpsertProblemInput = {
  url: string;
  title?: string;
  difficulty?: string;
  tags?: string;
};

/**
 * Puts a problem in a user's library. Idempotent — adding twice is a no-op.
 *
 * Problem is a shared catalogue, so this is the only thing that makes a problem
 * "yours". Anything that should make a problem appear in someone's list has to
 * call this.
 */
export async function linkUserToProblem(userId: string, problemId: string) {
  await prisma.userProblem.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: {},
    create: { userId, problemId },
  });
}

/**
 * Turns a pasted problem URL into a Problem row, reusing the existing row when
 * the same link has been added before, and puts it in the user's library.
 *
 * Plain module rather than a "use server" file so both the add-problem action
 * and the duel-from-URL action can share it instead of duplicating the parsing
 * and upsert rules. `userId` is a required parameter rather than optional so a
 * caller cannot silently create a problem that lands in nobody's library.
 */
export async function upsertProblemFromUrl(
  userId: string,
  input: UpsertProblemInput
) {
  // Client-side validation isn't a boundary — every caller is reachable by
  // POST, so the checks run here too.
  const parsed = parseProblemUrl(input.url);
  if (!parsed) throw new Error("That doesn't look like a valid problem URL.");

  // Best-effort lookup of the real title/difficulty/tags. Returns null on any
  // failure, in which case everything below falls back to what the user typed
  // and the slug-derived title.
  const metadata = await fetchProblemMetadata(parsed.source, parsed.externalId);

  // Anything the user typed explicitly wins over the fetched values — they can
  // see the problem and we can't.
  const title = input.title?.trim() || metadata?.title || parsed.suggestedTitle;

  const typedDifficulty =
    input.difficulty && input.difficulty in Difficulty
      ? (input.difficulty as Difficulty)
      : null;
  const difficulty = typedDifficulty ?? metadata?.difficulty ?? null;

  const typedTags = (input.tags ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const tagNames = Array.from(
    new Set(typedTags.length > 0 ? typedTags : (metadata?.tags ?? []))
  );

  // With an explicit join model, linking a tag means creating a ProblemTag row
  // whose `tag` is connected to an existing Tag or creates a new one.
  const createProblemTags = {
    create: tagNames.map((name) => ({
      tag: { connectOrCreate: { where: { name }, create: { name } } },
    })),
  };

  // On re-adding an existing problem, only touch the tags if some were typed —
  // otherwise submitting with an empty tag box would wipe the tags the problem
  // already has.
  const replaceProblemTags = tagNames.length
    ? { deleteMany: {}, ...createProblemTags }
    : undefined;

  // A problem with an external id is a shared catalog entry, so re-adding the
  // same link updates it instead of creating a duplicate.
  const problem = parsed.externalId
    ? await prisma.problem.upsert({
        where: {
          source_externalId: {
            source: parsed.source,
            externalId: parsed.externalId,
          },
        },
        update: {
          title,
          url: parsed.url,
          difficulty,
          problemTags: replaceProblemTags,
        },
        create: {
          source: parsed.source,
          externalId: parsed.externalId,
          title,
          url: parsed.url,
          difficulty,
          problemTags: createProblemTags,
        },
      })
    : await prisma.problem.create({
        data: {
          source: parsed.source,
          externalId: null,
          title,
          url: parsed.url,
          difficulty,
          problemTags: createProblemTags,
        },
      });

  await linkUserToProblem(userId, problem.id);

  return problem;
}

/**
 * Replaces a problem's topics.
 *
 * Exists because tags cannot always be fetched. LeetCode and Codeforces both
 * publish them, so those arrive on their own; a custom problem (a PDF, a blog
 * post, a university judge) has no such endpoint, and a fetch can simply fail.
 * Rather than making people type topics up front for every problem, the app
 * asks once, after an attempt, when it knows it has none.
 *
 * Names are lower-cased and de-duplicated so "DP", "dp" and " dp " are one tag
 * and the topic analytics do not split a topic three ways.
 */
export async function replaceProblemTags(problemId: string, rawTags: string[]) {
  const tagNames = Array.from(
    new Set(
      rawTags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    )
  );

  // One transaction: a half-applied edit would leave the problem with the old
  // rows deleted and the new ones missing, which reads as data loss.
  await prisma.$transaction([
    prisma.problemTag.deleteMany({ where: { problemId } }),
    ...tagNames.map((name) =>
      prisma.problemTag.create({
        data: {
          problem: { connect: { id: problemId } },
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        },
      })
    ),
  ]);

  return tagNames;
}

/**
 * Records how hard a problem felt to one user.
 *
 * Two different facts get written here, and which ones depend on the source:
 *
 * - `UserProblem.perceivedDifficulty` is always set. It is that user's opinion
 *   and is never visible to anyone else.
 * - `Problem.difficulty` is set ONLY for CUSTOM problems. A custom problem has
 *   no `externalId`, so it never dedups and its row belongs to exactly one
 *   person; nothing will ever fetch a rating for it, so the user's answer is
 *   the only rating it can have. Writing it means custom problems stop being
 *   "Unrated" everywhere and start counting in the difficulty breakdown.
 *
 * For LeetCode and Codeforces the platform's rating is left strictly alone.
 * Those rows are a shared catalogue: one person deciding Two Sum felt HARD
 * must not rewrite it as HARD in everyone else's dashboard. Both values are
 * kept side by side instead, which is what makes "you rate their Mediums as
 * Hard" answerable at all.
 */
export async function setPerceivedDifficulty(
  userId: string,
  problemId: string,
  difficulty: Difficulty
) {
  const problem = await prisma.problem.findFirst({
    // Scoped to the library, so an id alone cannot rate a problem you never
    // added, and for CUSTOM problems cannot reach someone else's row.
    where: { id: problemId, inLibraries: { some: { userId } } },
    select: { id: true, source: true },
  });
  if (!problem) throw new Error("Problem not found in your library.");

  const isCustom = problem.source === ProblemSource.CUSTOM;

  await prisma.$transaction([
    prisma.userProblem.update({
      where: { userId_problemId: { userId, problemId } },
      data: { perceivedDifficulty: difficulty },
    }),
    ...(isCustom
      ? [
          prisma.problem.update({
            where: { id: problemId },
            data: { difficulty },
          }),
        ]
      : []),
  ]);

  return { perceivedDifficulty: difficulty, appliedToProblem: isCustom };
}

/**
 * Renames a problem for one user, and for a custom problem records which site
 * it actually came from.
 *
 * The rename follows exactly the rule perceived difficulty follows, and for the
 * same reason: LeetCode and Codeforces rows are one shared catalogue entry per
 * problem, so a rename is stored as a per-user override and the official title
 * is left alone. A CUSTOM row belongs to one person, so the rename is written
 * through to the problem itself and the override is cleared, which keeps a
 * single source of truth rather than two copies that can drift.
 *
 * `platformLabel` is only meaningful for CUSTOM problems. LeetCode and
 * Codeforces already carry their platform in `source`, and letting someone
 * relabel a shared row would rewrite it for everyone.
 */
export async function updateProblemMeta(
  userId: string,
  problemId: string,
  input: { title?: string; platformLabel?: string | null }
) {
  const problem = await prisma.problem.findFirst({
    where: { id: problemId, inLibraries: { some: { userId } } },
    select: { id: true, source: true, title: true },
  });
  if (!problem) throw new Error("Problem not found in your library.");

  const isCustom = problem.source === ProblemSource.CUSTOM;

  const title = input.title?.trim().slice(0, MAX_TITLE_LENGTH);
  if (input.title !== undefined && !title) {
    throw new Error("A problem needs a title.");
  }

  const platformLabel =
    input.platformLabel === undefined
      ? undefined
      : input.platformLabel?.trim().slice(0, MAX_PLATFORM_LABEL_LENGTH) || null;

  const writes = [];

  if (title !== undefined) {
    writes.push(
      prisma.userProblem.update({
        where: { userId_problemId: { userId, problemId } },
        // Cleared for a custom problem: the real title below becomes the only
        // copy, so an override would just be a stale duplicate of it.
        data: { customTitle: isCustom ? null : title },
      })
    );

    if (isCustom) {
      writes.push(
        prisma.problem.update({ where: { id: problemId }, data: { title } })
      );
    }
  }

  // Silently ignored for LeetCode and Codeforces rather than throwing: the UI
  // does not offer the field there, so a value arriving is a stale form, not
  // something worth failing the whole save over.
  if (platformLabel !== undefined && isCustom) {
    writes.push(
      prisma.problem.update({
        where: { id: problemId },
        data: { platformLabel },
      })
    );
  }

  if (writes.length > 0) await prisma.$transaction(writes);

  return { title: title ?? problem.title, appliedToProblem: isCustom };
}
