-- Adds the short join code players type to enter a duel.
--
-- Safe as a plain NOT NULL column because the Duel table is empty; if it ever
-- has rows, this needs to be added nullable, backfilled with generated codes,
-- and only then set NOT NULL.

-- AlterTable
ALTER TABLE "Duel" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Duel_code_key" ON "Duel"("code");
