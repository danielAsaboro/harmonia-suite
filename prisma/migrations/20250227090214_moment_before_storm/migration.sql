-- AlterTable
ALTER TABLE "draft_threads" ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "draft_tweets" ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "draft_threads_teamId_idx" ON "draft_threads"("teamId");

-- CreateIndex
CREATE INDEX "draft_tweets_teamId_idx" ON "draft_tweets"("teamId");

-- AddForeignKey
ALTER TABLE "draft_tweets" ADD CONSTRAINT "draft_tweets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_threads" ADD CONSTRAINT "draft_threads_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
