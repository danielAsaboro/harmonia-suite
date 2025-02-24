/*
  Warnings:

  - A unique constraint covering the columns `[teamId,userId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
