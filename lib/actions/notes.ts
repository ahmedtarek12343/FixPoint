"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireUserForWrite } from "@/lib/current-user";
import { MAX_NOTE_LENGTH } from "@/lib/constants";
import {
  normalizePageArgs,
  toPage,
  type Page,
  type PageArgs,
} from "@/lib/pagination";

export type NoteItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  problemId: string;
  problemTitle: string;
};

/** Notes are private to their author — every query is scoped by userId, never
 *  by note id alone. */
export async function listProblemNotes(problemId: string): Promise<NoteItem[]> {
  const user = await requireCurrentUser();

  const notes = await prisma.note.findMany({
    where: { userId: user.id, problemId },
    orderBy: { createdAt: "desc" },
    include: { problem: { select: { title: true } } },
  });

  return notes.map((note) => ({
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    problemId: note.problemId,
    problemTitle: note.problem.title,
  }));
}

export async function listUserNotes(
  args: PageArgs = {}
): Promise<Page<NoteItem>> {
  const user = await requireCurrentUser();
  const { page, pageSize, skip, take } = normalizePageArgs(args);

  const where = { userId: user.id };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { problem: { select: { title: true } } },
    }),
    prisma.note.count({ where }),
  ]);

  return toPage(
    notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      problemId: note.problemId,
      problemTitle: note.problem.title,
    })),
    total,
    page,
    pageSize
  );
}

export async function addNote(input: { problemId: string; content: string }) {
  const user = await requireUserForWrite();

  const content = input.content.trim();
  if (!content) throw new Error("A note needs some text.");
  if (content.length > MAX_NOTE_LENGTH) {
    throw new Error(`Notes are limited to ${MAX_NOTE_LENGTH} characters.`);
  }

  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true },
  });
  if (!problem) throw new Error("Problem not found");

  const note = await prisma.note.create({
    data: { userId: user.id, problemId: input.problemId, content },
  });

  return { id: note.id };
}

export async function updateNote(input: { id: string; content: string }) {
  const user = await requireUserForWrite();

  const content = input.content.trim();
  if (!content) throw new Error("A note needs some text.");
  if (content.length > MAX_NOTE_LENGTH) {
    throw new Error(`Notes are limited to ${MAX_NOTE_LENGTH} characters.`);
  }

  // Scoped by userId so one user can't edit another's note by guessing an id.
  const { count } = await prisma.note.updateMany({
    where: { id: input.id, userId: user.id },
    data: { content },
  });
  if (count === 0) throw new Error("Note not found");

  return { id: input.id };
}

export async function deleteNote(id: string) {
  const user = await requireUserForWrite();

  const { count } = await prisma.note.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) throw new Error("Note not found");

  return { id };
}
