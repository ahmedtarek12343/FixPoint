/**
 * Throwaway check for setPerceivedDifficulty against the real database.
 *
 * The rule it verifies is the one thing about this feature that could quietly
 * corrupt shared data: a CUSTOM problem takes the user's rating as its own
 * difficulty, while a LeetCode or Codeforces row must never be rewritten,
 * because that row is shared with every other user.
 *
 * Run with: bun run scripts/verify-rating.ts
 * Creates its own rows and deletes them again, whatever happens.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { setPerceivedDifficulty } from "@/lib/data/problems";
import { Difficulty, ProblemSource } from "@/generated/prisma/enums";

const stamp = Date.now();
const ids: { user?: string; custom?: string; shared?: string } = {};

async function main() {
  const user = await prisma.user.create({
    data: {
      clerkId: `verify_${stamp}`,
      email: `verify_${stamp}@example.invalid`,
      name: "Verification",
    },
  });
  ids.user = user.id;

  const custom = await prisma.problem.create({
    data: {
      source: ProblemSource.CUSTOM,
      externalId: null,
      title: `verify custom ${stamp}`,
      url: `https://example.invalid/${stamp}`,
      difficulty: null,
      inLibraries: { create: { userId: user.id } },
    },
  });
  ids.custom = custom.id;

  const shared = await prisma.problem.create({
    data: {
      source: ProblemSource.LEETCODE,
      externalId: `verify-${stamp}`,
      title: `verify leetcode ${stamp}`,
      url: `https://leetcode.com/problems/verify-${stamp}/`,
      difficulty: Difficulty.MEDIUM,
      inLibraries: { create: { userId: user.id } },
    },
  });
  ids.shared = shared.id;

  // --- custom: the rating must land on the problem too --------------------
  await setPerceivedDifficulty(user.id, custom.id, Difficulty.HARD);

  const customAfter = await prisma.problem.findUniqueOrThrow({
    where: { id: custom.id },
    select: { difficulty: true },
  });
  const customLink = await prisma.userProblem.findUniqueOrThrow({
    where: { userId_problemId: { userId: user.id, problemId: custom.id } },
    select: { perceivedDifficulty: true },
  });

  const customOk =
    customAfter.difficulty === Difficulty.HARD &&
    customLink.perceivedDifficulty === Difficulty.HARD;

  console.log(
    `${customOk ? "PASS" : "FAIL"}  custom: problem.difficulty=${customAfter.difficulty} perceived=${customLink.perceivedDifficulty} (both should be HARD)`
  );

  // --- leetcode: the shared row must be untouched --------------------------
  await setPerceivedDifficulty(user.id, shared.id, Difficulty.HARD);

  const sharedAfter = await prisma.problem.findUniqueOrThrow({
    where: { id: shared.id },
    select: { difficulty: true },
  });
  const sharedLink = await prisma.userProblem.findUniqueOrThrow({
    where: { userId_problemId: { userId: user.id, problemId: shared.id } },
    select: { perceivedDifficulty: true },
  });

  const sharedOk =
    sharedAfter.difficulty === Difficulty.MEDIUM &&
    sharedLink.perceivedDifficulty === Difficulty.HARD;

  console.log(
    `${sharedOk ? "PASS" : "FAIL"}  leetcode: problem.difficulty=${sharedAfter.difficulty} (should stay MEDIUM) perceived=${sharedLink.perceivedDifficulty} (should be HARD)`
  );

  // --- ownership: a problem outside the library must be refused -----------
  const outsider = await prisma.problem.create({
    data: {
      source: ProblemSource.LEETCODE,
      externalId: `verify-outsider-${stamp}`,
      title: `verify outsider ${stamp}`,
      url: `https://leetcode.com/problems/verify-outsider-${stamp}/`,
      difficulty: Difficulty.EASY,
    },
  });

  let refused = false;
  try {
    await setPerceivedDifficulty(user.id, outsider.id, Difficulty.HARD);
  } catch {
    refused = true;
  }
  console.log(
    `${refused ? "PASS" : "FAIL"}  rating a problem not in your library is refused`
  );

  await prisma.problem.delete({ where: { id: outsider.id } });
}

main()
  .catch((error) => {
    console.error("ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Cascades take the UserProblem rows with them.
    if (ids.custom) await prisma.problem.delete({ where: { id: ids.custom } });
    if (ids.shared) await prisma.problem.delete({ where: { id: ids.shared } });
    if (ids.user) await prisma.user.delete({ where: { id: ids.user } });
    console.log("cleaned up");
    await prisma.$disconnect();
  });
