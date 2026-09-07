-- Saved snapshots of a problem's whiteboard, stored as SVG text.
-- Purely additive: a new table with no changes to existing ones.

-- CreateTable
CREATE TABLE "WhiteboardSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "label" TEXT,
    "svg" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhiteboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Matches the only read pattern: this user's snapshots for one problem, newest first.
CREATE INDEX "WhiteboardSnapshot_userId_problemId_createdAt_idx" ON "WhiteboardSnapshot"("userId", "problemId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhiteboardSnapshot" ADD CONSTRAINT "WhiteboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteboardSnapshot" ADD CONSTRAINT "WhiteboardSnapshot_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
