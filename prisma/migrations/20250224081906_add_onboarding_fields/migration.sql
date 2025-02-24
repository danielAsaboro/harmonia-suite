/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `user_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress]` on the table `user_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_tokens" ADD COLUMN     "contentPreferences" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN     "walletAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_email_key" ON "user_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_walletAddress_key" ON "user_tokens"("walletAddress");
