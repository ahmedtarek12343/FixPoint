"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { MAX_SNAPSHOT_LENGTH } from "@/lib/constants";
import { isSvgSafe, looksLikeSvg } from "@/lib/svg-safety";

export type SnapshotItem = {
  id: string;
  label: string | null;
  svg: string;
  createdAt: string;
};

export async function listSnapshots(
  problemId: string
): Promise<SnapshotItem[]> {
  const user = await requireCurrentUser();

  const snapshots = await prisma.whiteboardSnapshot.findMany({
    where: { userId: user.id, problemId },
    orderBy: { createdAt: "desc" },
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    label: snapshot.label,
    svg: snapshot.svg,
    createdAt: snapshot.createdAt.toISOString(),
  }));
}

export async function createSnapshot(input: {
  problemId: string;
  svg: string;
  label?: string;
}) {
  const user = await requireUserForWrite();

  const svg = input.svg.trim();
  if (!looksLikeSvg(svg)) throw new Error("That isn't an SVG image.");
  if (svg.length > MAX_SNAPSHOT_LENGTH) {
    throw new Error(
      "That drawing is too large to save — try snapshotting a smaller area."
    );
  }
  if (!isSvgSafe(svg)) {
    throw new Error("That SVG contains scripting and was not saved.");
  }

  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true },
  });
  if (!problem) throw new Error("Problem not found");

  const snapshot = await prisma.whiteboardSnapshot.create({
    data: {
      userId: user.id,
      problemId: input.problemId,
      svg,
      label: input.label?.trim() || null,
    },
  });

  return { id: snapshot.id };
}

export async function deleteSnapshot(id: string) {
  const user = await requireUserForWrite();

  // Scoped by userId so an id alone can't reach someone else's snapshot.
  const { count } = await prisma.whiteboardSnapshot.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) throw new Error("Snapshot not found");

  return { id };
}
