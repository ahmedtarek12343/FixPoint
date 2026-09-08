"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { recordDuelFinish } from "@/lib/data/duels";
import { linkUserToProblem, upsertProblemFromUrl } from "@/lib/data/problems";
import {
  normalizePageArgs,
  toPage,
  type Page,
  type PageArgs,
} from "@/lib/pagination";
import { DuelStatus } from "@/generated/prisma/enums";

export type DuelHistoryItem = {
  id: string;
  code: string;
  status: DuelStatus;
  createdAt: string;
  endedAt: string | null;
  problemId: string;
  problemTitle: string;
  yourRank: number | null;
  opponents: { name: string; rank: number | null }[];
};

export async function listDuels(
  args: PageArgs = {},
): Promise<Page<DuelHistoryItem>> {
  const user = await requireCurrentUser();
  const { page, pageSize, skip, take } = normalizePageArgs(args);

  const where = { participants: { some: { userId: user.id } } };

  const [duels, total] = await Promise.all([
    prisma.duel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        problem: { select: { id: true, title: true } },
        participants: {
          include: { user: { select: { name: true } } },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    prisma.duel.count({ where }),
  ]);

  const items = duels.map((duel) => ({
    id: duel.id,
    code: duel.code,
    status: duel.status,
    createdAt: duel.createdAt.toISOString(),
    endedAt: duel.endedAt?.toISOString() ?? null,
    problemId: duel.problem.id,
    problemTitle: duel.problem.title,
    yourRank: duel.participants.find((p) => p.userId === user.id)?.rank ?? null,
    opponents: duel.participants
      .filter((p) => p.userId !== user.id)
      .map((p) => ({ name: p.user.name || "Anonymous", rank: p.rank })),
  }));

  return toPage(items, total, page, pageSize);
}

/** No I/L/O/0/1 — these are read aloud and typed by hand. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(
    bytes,
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join("");
}

/** Not exported: a "use server" file may only export async functions, and this
 *  is shared by both create paths. */
async function allocateDuel(userId: string, problemId: string) {
  // Codes are random, so a collision is possible but rare; retry rather than
  // failing the request.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const duel = await prisma.duel.create({
        data: {
          code: generateCode(),
          problemId,
          status: DuelStatus.PENDING,
          participants: { create: { userId } },
        },
      });
      return { id: duel.id, code: duel.code };
    } catch (error) {
      const isCodeCollision =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === "P2002";

      if (!isCodeCollision) throw error;
    }
  }

  throw new Error("Could not allocate a duel code, please try again.");
}

export async function createDuel(problemId: string) {
  const user = await requireUserForWrite();

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new Error("Problem not found");

  return allocateDuel(user.id, problemId);
}

/**
 * Race on a problem that isn't in the catalogue yet: the URL is upserted into a
 * Problem first (reusing the row if that link already exists), then the duel is
 * created against it — one round trip rather than two queued actions.
 */
export async function createDuelFromUrl(url: string) {
  const user = await requireUserForWrite();

  const problem = await upsertProblemFromUrl(user.id, { url });
  return allocateDuel(user.id, problem.id);
}

export async function joinDuel(rawCode: string) {
  const user = await requireUserForWrite();

  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error("Enter a join code.");

  const duel = await prisma.duel.findUnique({
    where: { code },
    include: { participants: true },
  });
  if (!duel) throw new Error("No duel with that code.");

  // Rejoining your own duel is fine; joining someone else's after it started
  // is not — you'd be racing from behind.
  const alreadyIn = duel.participants.some(
    (participant) => participant.userId === user.id,
  );
  if (alreadyIn) return { id: duel.id };

  if (duel.status !== DuelStatus.PENDING) {
    throw new Error("That duel has already started.");
  }

  await prisma.duelParticipant.create({
    data: { duelId: duel.id, userId: user.id },
  });

  // Joining a duel puts its problem in your library, so it's still findable
  // afterwards instead of only reachable through the duel.
  await linkUserToProblem(user.id, duel.problemId);

  return { id: duel.id };
}

export async function startDuel(duelId: string) {
  const user = await requireUserForWrite();

  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: { participants: { orderBy: { joinedAt: "asc" } } },
  });
  if (!duel) throw new Error("Duel not found");
  if (duel.participants[0]?.userId !== user.id) {
    throw new Error("Only the host can start the duel.");
  }
  if (duel.status !== DuelStatus.PENDING) return;
  if (duel.participants.length < 2) {
    throw new Error("Wait for someone to join first.");
  }

  // One shared startedAt is what makes both timers agree.
  await prisma.duel.update({
    where: { id: duelId },
    data: { status: DuelStatus.ACTIVE, startedAt: new Date() },
  });
}

export async function finishDuel(duelId: string) {
  const user = await requireUserForWrite();
  return recordDuelFinish(user.id, duelId);
}
