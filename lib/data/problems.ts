import { prisma } from "@/lib/prisma";
import { parseProblemUrl } from "@/lib/problem-url";
import { fetchProblemMetadata } from "@/lib/data/problem-metadata";
import { Difficulty } from "@/generated/prisma/enums";

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
