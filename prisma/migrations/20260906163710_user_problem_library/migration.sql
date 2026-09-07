-- Per-user problem libraries.
--
-- Problem stays a shared catalogue keyed by (source, externalId) so two users
-- can duel on the same row. This join table records whose library each problem
-- is in, which is what makes "your problems" actually per-user.

-- CreateTable
CREATE TABLE "UserProblem" (
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProblem_pkey" PRIMARY KEY ("userId","problemId")
);

-- CreateIndex
CREATE INDEX "UserProblem_problemId_idx" ON "UserProblem"("problemId");

-- AddForeignKey
ALTER TABLE "UserProblem" ADD CONSTRAINT "UserProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProblem" ADD CONSTRAINT "UserProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: before this table existed, "in my library" was implied by having
-- interacted with a problem at all. Reconstruct that from every such signal so
-- existing users keep the problems they were already working on.
INSERT INTO "UserProblem" ("userId", "problemId", "addedAt")
SELECT "userId", "problemId", MIN("at") AS "addedAt"
FROM (
    SELECT "userId", "problemId", "createdAt" AS "at" FROM "Attempt"
    UNION ALL
    SELECT "userId", "problemId", "createdAt" FROM "Note"
    UNION ALL
    SELECT "userId", "problemId", "createdAt" FROM "Solution"
    UNION ALL
    SELECT "userId", "problemId", "createdAt" FROM "Whiteboard"
    UNION ALL
    SELECT "userId", "problemId", "createdAt" FROM "WhiteboardSnapshot"
    UNION ALL
    SELECT dp."userId", d."problemId", dp."joinedAt"
    FROM "DuelParticipant" dp
    JOIN "Duel" d ON d."id" = dp."duelId"
) AS signals
GROUP BY "userId", "problemId"
ON CONFLICT ("userId", "problemId") DO NOTHING;
