-- AlterTable
ALTER TABLE "user_tokens" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedType" TEXT;
