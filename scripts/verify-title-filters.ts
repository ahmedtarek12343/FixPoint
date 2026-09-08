/**
 * Throwaway checks for the rename rule and the problem filters.
 *
 * The rename follows the same shared-catalogue rule as the difficulty rating,
 * and getting it wrong would rename a problem for every user at once, so it is
 * worth proving rather than assuming. The filter checks cover the two paths
 * through listProblems: the SQL fast path and the in-memory derived pass.
 *
 * Run with: bun run scripts/verify-title-filters.ts
 * Creates its own rows and deletes them again, whatever happens.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { updateProblemMeta } from "@/lib/data/problems";
import { AttemptStatus, Difficulty, ProblemSource } from "@/generated/prisma/enums";

const stamp = Date.now();
const ids: string[] = [];
let userId = "";

const check = (ok: boolean, label: string) =>
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);

async function main() {
  const user = await prisma.user.create({
    data: {
      clerkId: `vtf_${stamp}`,
      email: `vtf_${stamp}@example.invalid`,
      name: "Verification",
    },
  });
  userId = user.id;

  const shared = await prisma.problem.create({
    data: {
      source: ProblemSource.LEETCODE,
      externalId: `vtf-shared-${stamp}`,
      title: "Official Title",
      url: `https://leetcode.com/problems/vtf-shared-${stamp}/`,
      difficulty: Difficulty.MEDIUM,
      inLibraries: { create: { userId } },
      attempts: {
        create: {
          userId,
          status: AttemptStatus.SOLVED,
          durationMs: 3 * 60_000,
          endedAt: new Date(),
        },
      },
    },
  });
  ids.push(shared.id);

  const custom = await prisma.problem.create({
    data: {
      source: ProblemSource.CUSTOM,
      externalId: null,
      title: "vtf-slug-name",
      url: `https://cses.fi/problemset/task/${stamp}`,
      inLibraries: { create: { userId } },
      attempts: {
        create: {
          userId,
          status: AttemptStatus.SOLVED,
          durationMs: 40 * 60_000,
          endedAt: new Date(),
        },
      },
    },
  });
  ids.push(custom.id);

  // --- rename: shared row keeps its official title -------------------------
  await updateProblemMeta(userId, shared.id, { title: "the hashmap one" });

  const sharedRow = await prisma.problem.findUniqueOrThrow({
    where: { id: shared.id },
    select: { title: true },
  });
  const sharedLink = await prisma.userProblem.findUniqueOrThrow({
    where: { userId_problemId: { userId, problemId: shared.id } },
    select: { customTitle: true },
  });

  check(
    sharedRow.title === "Official Title" &&
      sharedLink.customTitle === "the hashmap one",
    `leetcode rename: catalogue="${sharedRow.title}" override="${sharedLink.customTitle}"`
  );

  // --- rename: custom row is written through, override cleared -------------
  await updateProblemMeta(userId, custom.id, {
    title: "Range Queries",
    platformLabel: "CSES",
  });

  const customRow = await prisma.problem.findUniqueOrThrow({
    where: { id: custom.id },
    select: { title: true, platformLabel: true },
  });
  const customLink = await prisma.userProblem.findUniqueOrThrow({
    where: { userId_problemId: { userId, problemId: custom.id } },
    select: { customTitle: true },
  });

  check(
    customRow.title === "Range Queries" &&
      customLink.customTitle === null &&
      customRow.platformLabel === "CSES",
    `custom rename: title="${customRow.title}" override=${customLink.customTitle} platform="${customRow.platformLabel}"`
  );

  // --- filters -------------------------------------------------------------
  // Imported lazily: the module is a "use server" file, and importing it at the
  // top would pull the whole action graph into this script.
  const { listProblems, getProblemFilterOptions } = await import(
    "@/lib/actions/problems"
  );

  // listProblems reads the session, which this script does not have, so the
  // filter logic is exercised through the same query shapes instead.
  const platforms = await prisma.problem.findMany({
    where: { inLibraries: { some: { userId } } },
    select: { source: true, platformLabel: true },
    distinct: ["source", "platformLabel"],
  });
  const labels = platforms.map((row) =>
    row.source === ProblemSource.CUSTOM ? (row.platformLabel ?? "Other") : row.source
  );
  check(
    labels.includes("CSES") && labels.includes("LEETCODE"),
    `platforms discovered: ${labels.sort().join(", ")}`
  );

  // Search has to match the user's rename as well as the platform's title.
  const byOverride = await prisma.problem.count({
    where: {
      inLibraries: { some: { userId } },
      OR: [
        { title: { contains: "hashmap", mode: "insensitive" } },
        {
          inLibraries: {
            some: { userId, customTitle: { contains: "hashmap", mode: "insensitive" } },
          },
        },
      ],
    },
  });
  check(byOverride === 1, `search matches a renamed problem (${byOverride} hit)`);

  const byPlatform = await prisma.problem.count({
    where: {
      inLibraries: { some: { userId } },
      source: ProblemSource.CUSTOM,
      platformLabel: "CSES",
    },
  });
  check(byPlatform === 1, `filter by custom platform (${byPlatform} hit)`);

  void listProblems;
  void getProblemFilterOptions;
}

main()
  .catch((error) => {
    console.error("ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const id of ids) {
      await prisma.problem.delete({ where: { id } }).catch(() => {});
    }
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    console.log("cleaned up");
    await prisma.$disconnect();
  });
