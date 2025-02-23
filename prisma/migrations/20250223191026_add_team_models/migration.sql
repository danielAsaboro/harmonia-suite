-- CreateTable
CREATE TABLE "user_tokens" (
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImageUrl" TEXT,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "scheduled_tweets" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaIds" TEXT,
    "scheduledFor" TEXT NOT NULL,
    "threadId" TEXT,
    "position" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "error" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "scheduled_tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_threads" (
    "id" TEXT NOT NULL,
    "tweetIds" TEXT NOT NULL,
    "scheduledFor" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "error" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "scheduled_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_tweets" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaIds" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "threadId" TEXT,
    "position" INTEGER,
    "tags" TEXT,
    "userId" TEXT NOT NULL,
    "approvalId" TEXT,
    "approvedAt" TEXT,
    "rejectedAt" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "draft_tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_threads" (
    "id" TEXT NOT NULL,
    "tweetIds" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT,
    "userId" TEXT NOT NULL,
    "approvalId" TEXT,
    "approvedAt" TEXT,
    "rejectedAt" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "draft_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_drafts" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "draftType" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "canComment" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorProfileUrl" TEXT,
    "shareState" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "shared_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_draft_comments" (
    "id" TEXT NOT NULL,
    "sharedDraftId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "position" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TEXT,
    "resolvedBy" TEXT,

    CONSTRAINT "shared_draft_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_approvals" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "blockchainId" TEXT NOT NULL,
    "submittedAt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiredApprovals" INTEGER NOT NULL,
    "currentApprovals" INTEGER NOT NULL,
    "approvers" TEXT,
    "rejectionReason" TEXT,
    "transactionSignature" TEXT,

    CONSTRAINT "content_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TEXT NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "acceptedAt" TEXT,
    "acceptedBy" TEXT,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_accessToken_key" ON "user_tokens"("accessToken");

-- CreateIndex
CREATE INDEX "scheduled_tweets_userId_idx" ON "scheduled_tweets"("userId");

-- CreateIndex
CREATE INDEX "scheduled_tweets_scheduledFor_idx" ON "scheduled_tweets"("scheduledFor");

-- CreateIndex
CREATE INDEX "scheduled_threads_userId_idx" ON "scheduled_threads"("userId");

-- CreateIndex
CREATE INDEX "scheduled_threads_scheduledFor_idx" ON "scheduled_threads"("scheduledFor");

-- CreateIndex
CREATE INDEX "draft_tweets_threadId_idx" ON "draft_tweets"("threadId");

-- CreateIndex
CREATE INDEX "draft_tweets_userId_idx" ON "draft_tweets"("userId");

-- CreateIndex
CREATE INDEX "draft_threads_userId_idx" ON "draft_threads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_drafts_accessToken_key" ON "shared_drafts"("accessToken");

-- CreateIndex
CREATE INDEX "shared_drafts_draftId_idx" ON "shared_drafts"("draftId");

-- CreateIndex
CREATE INDEX "shared_drafts_accessToken_idx" ON "shared_drafts"("accessToken");

-- CreateIndex
CREATE INDEX "shared_drafts_creatorId_idx" ON "shared_drafts"("creatorId");

-- CreateIndex
CREATE INDEX "shared_draft_comments_resolved_idx" ON "shared_draft_comments"("resolved");

-- CreateIndex
CREATE INDEX "shared_draft_comments_authorId_idx" ON "shared_draft_comments"("authorId");

-- CreateIndex
CREATE INDEX "shared_draft_comments_sharedDraftId_idx" ON "shared_draft_comments"("sharedDraftId");

-- CreateIndex
CREATE INDEX "content_approvals_contentId_idx" ON "content_approvals"("contentId");

-- CreateIndex
CREATE INDEX "content_approvals_blockchainId_idx" ON "content_approvals"("blockchainId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_teamId_idx" ON "team_invites"("teamId");

-- CreateIndex
CREATE INDEX "team_invites_email_idx" ON "team_invites"("email");

-- CreateIndex
CREATE INDEX "team_invites_token_idx" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_status_idx" ON "team_invites"("status");

-- CreateIndex
CREATE INDEX "team_invites_createdBy_idx" ON "team_invites"("createdBy");

-- AddForeignKey
ALTER TABLE "scheduled_tweets" ADD CONSTRAINT "scheduled_tweets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_tweets" ADD CONSTRAINT "scheduled_tweets_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "scheduled_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_threads" ADD CONSTRAINT "scheduled_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_tweets" ADD CONSTRAINT "draft_tweets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_tweets" ADD CONSTRAINT "draft_tweets_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "draft_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_threads" ADD CONSTRAINT "draft_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_drafts" ADD CONSTRAINT "shared_drafts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_draft_comments" ADD CONSTRAINT "shared_draft_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user_tokens"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_draft_comments" ADD CONSTRAINT "shared_draft_comments_sharedDraftId_fkey" FOREIGN KEY ("sharedDraftId") REFERENCES "shared_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user_tokens"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "user_tokens"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
