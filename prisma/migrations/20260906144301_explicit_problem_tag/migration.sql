-- Replaces the implicit many-to-many join table `_ProblemToTag` with an
-- explicit `ProblemTag` model.
--
-- The generated diff dropped the old table before creating the new one, which
-- would have thrown away every existing tag link. Reordered here so the new
-- table exists first, the rows are copied across, and only then is the old
-- table dropped.

-- CreateTable
CREATE TABLE "ProblemTag" (
    "problemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("problemId","tagId")
);

-- CreateIndex
CREATE INDEX "ProblemTag_tagId_idx" ON "ProblemTag"("tagId");

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry existing links over. In the implicit table, "A" was Problem.id and
-- "B" was Tag.id (Prisma orders the columns alphabetically by model name).
INSERT INTO "ProblemTag" ("problemId", "tagId")
SELECT "A", "B" FROM "_ProblemToTag";

-- DropForeignKey
ALTER TABLE "_ProblemToTag" DROP CONSTRAINT "_ProblemToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProblemToTag" DROP CONSTRAINT "_ProblemToTag_B_fkey";

-- DropTable
DROP TABLE "_ProblemToTag";
