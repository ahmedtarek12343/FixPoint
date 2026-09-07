"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { autosaveLimiter, enforceRateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The scene is stored as opaque JSON — Excalidraw owns its shape, and pinning
 * a type here would break every time the library adds a field.
 */
export type WhiteboardScene = {
  elements: unknown[];
  appState?: Record<string, unknown>;
};

export type WhiteboardData = {
  scene: WhiteboardScene | null;
  updatedAt: string | null;
};

/** One board per user per problem, so a duel on a problem reuses the board the
 *  player already has for it. */
export async function getWhiteboard(problemId: string): Promise<WhiteboardData> {
  const user = await requireCurrentUser();

  const board = await prisma.whiteboard.findUnique({
    where: { userId_problemId: { userId: user.id, problemId } },
  });

  if (!board) return { scene: null, updatedAt: null };

  return {
    scene: board.data as WhiteboardScene,
    updatedAt: board.updatedAt.toISOString(),
  };
}

export async function saveWhiteboard(input: {
  problemId: string;
  scene: WhiteboardScene;
}) {
  const user = await requireCurrentUser();
  // Autosave fires on a 1.5s debounce while drawing, so it gets its own much
  // looser budget rather than eating the shared write allowance.
  await enforceRateLimit(autosaveLimiter, user.id);

  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true },
  });
  if (!problem) throw new Error("Problem not found");

  // Prisma's Json input type can't see that this object is JSON-safe (its
  // `unknown[]` elements defeat the index-signature check), so the cast happens
  // once, here at the database boundary, rather than leaking JSON types into
  // the editor code.
  const data = input.scene as unknown as Prisma.InputJsonObject;

  const board = await prisma.whiteboard.upsert({
    where: { userId_problemId: { userId: user.id, problemId: input.problemId } },
    update: { data },
    create: {
      userId: user.id,
      problemId: input.problemId,
      data,
    },
  });

  return { updatedAt: board.updatedAt.toISOString() };
}
