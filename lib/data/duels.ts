import { prisma } from "@/lib/prisma";
import { DuelStatus } from "@/generated/prisma/enums";

/**
 * Plain module — no "use server" and no "use client".
 *
 * The duel view is read from two places: the server component prefetches it by
 * calling this directly, and the polling Route Handler calls it per request.
 * Polling deliberately does NOT go through a Server Action, because actions are
 * queued — a 2s poll would share a queue with the "I solved it" mutation and
 * could delay the one call that decides the winner.
 */

export type DuelParticipantView = {
  userId: string;
  name: string;
  imageUrl: string | null;
  finishedAt: string | null;
  rank: number | null;
  isYou: boolean;
};

export type DuelView = {
  id: string;
  code: string;
  status: DuelStatus;
  startedAt: string | null;
  endedAt: string | null;
  problem: {
    id: string;
    title: string;
    url: string;
    source: string;
    difficulty: string | null;
  };
  participants: DuelParticipantView[];
  you: {
    isParticipant: boolean;
    isHost: boolean;
    finishedAt: string | null;
    rank: number | null;
  };
};

/**
 * Records that `userId` finished, assigning them the next free rank, and closes
 * the duel once everyone is done. Returns null if there was nothing to record.
 *
 * Lives here rather than in the action so it can be exercised directly (the
 * action is just an auth wrapper around it).
 */
export async function recordDuelFinish(userId: string, duelId: string) {
  return prisma.$transaction(async (tx) => {
    // Lock the duel row first. A transaction alone is NOT enough: Postgres
    // defaults to Read Committed, and two players finishing at the same instant
    // update *different* participant rows, so nothing would serialize them —
    // both would read "nobody has finished" and both claim rank 1. Taking a
    // lock on the shared parent row forces them into an order.
    await tx.$queryRaw`SELECT id FROM "Duel" WHERE id = ${duelId} FOR UPDATE`;

    const duel = await tx.duel.findUnique({
      where: { id: duelId },
      include: { participants: true },
    });
    if (!duel || duel.status !== DuelStatus.ACTIVE) return null;

    const you = duel.participants.find(
      (participant) => participant.userId === userId
    );
    if (!you || you.finishedAt) return null;

    const alreadyFinished = duel.participants.filter(
      (participant) => participant.finishedAt
    ).length;
    const rank = alreadyFinished + 1;

    await tx.duelParticipant.update({
      where: { duelId_userId: { duelId, userId } },
      data: { finishedAt: new Date(), rank },
    });

    if (rank === duel.participants.length) {
      await tx.duel.update({
        where: { id: duelId },
        data: { status: DuelStatus.FINISHED, endedAt: new Date() },
      });
    }

    return { rank };
  });
}

export async function getDuelState(
  userId: string,
  duelId: string
): Promise<DuelView | null> {
  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: {
      problem: true,
      participants: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!duel) return null;

  const you = duel.participants.find(
    (participant) => participant.userId === userId
  );

  return {
    id: duel.id,
    code: duel.code,
    status: duel.status,
    startedAt: duel.startedAt?.toISOString() ?? null,
    endedAt: duel.endedAt?.toISOString() ?? null,
    problem: {
      id: duel.problem.id,
      title: duel.problem.title,
      url: duel.problem.url,
      source: duel.problem.source,
      difficulty: duel.problem.difficulty,
    },
    participants: duel.participants.map((participant) => ({
      userId: participant.userId,
      name: participant.user.name || "Anonymous",
      imageUrl: participant.user.imageUrl,
      finishedAt: participant.finishedAt?.toISOString() ?? null,
      rank: participant.rank,
      isYou: participant.userId === userId,
    })),
    you: {
      isParticipant: Boolean(you),
      // The host is whoever created the duel, i.e. joined first.
      isHost: duel.participants[0]?.userId === userId,
      finishedAt: you?.finishedAt?.toISOString() ?? null,
      rank: you?.rank ?? null,
    },
  };
}
