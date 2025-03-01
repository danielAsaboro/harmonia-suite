import { PrismaClient } from "@prisma/client";
import { DraftTweet } from "../schema";

export class PrismaDraftTweetsService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // Adapter method to convert Prisma result to DraftTweet
  private adaptDraftTweet(tweet: any): DraftTweet {
    // console.log(" printing adapt tweet");
    // console.dir(tweet, { depth: null });
    return {
      id: tweet.id,
      content: tweet.content,
      media: tweet.mediaMetadata ? JSON.parse(tweet.mediaMetadata) : undefined,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      status: tweet.status,
      threadId: tweet.threadId || undefined,
      position: tweet.position || undefined,
      tags: tweet.tags ? JSON.parse(tweet.tags) : [],
      userId: tweet.userId,
      teamId: tweet.teamId,
    };
  }

  // Save a draft tweet
  async saveDraftTweet(tweet: DraftTweet): Promise<void> {
    await this.prisma.draft_tweets.upsert({
      where: { id: tweet.id },
      update: {
        content: tweet.content,
        mediaMetadata: tweet.media ? JSON.stringify(tweet.media) : null,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
        status: tweet.status,
        threadId: tweet.threadId || null,
        position: tweet.position !== undefined ? tweet.position : null,
        tags: JSON.stringify(tweet.tags || []),
        userId: tweet.userId,
        teamId: tweet.teamId || null,
        isSubmitted: tweet.isSubmitted || false,
        approvalId: tweet.approvalId || null,
        approvedAt: tweet.approvedAt || null,
        rejectedAt: tweet.rejectedAt || null,
        rejectionReason: tweet.rejectionReason || null,
      },
      create: {
        id: tweet.id,
        content: tweet.content,
        mediaMetadata: tweet.media ? JSON.stringify(tweet.media) : null,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
        status: tweet.status,
        threadId: tweet.threadId || null,
        position: tweet.position || null,
        tags: JSON.stringify(tweet.tags || []),
        userId: tweet.userId,
        teamId: tweet.teamId || null,
        isSubmitted: tweet.isSubmitted || false,
        approvalId: tweet.approvalId || null,
        approvedAt: tweet.approvedAt || null,
        rejectedAt: tweet.rejectedAt || null,
        rejectionReason: tweet.rejectionReason || null,
      },
    });
  }

  // Get a specific draft tweet
  async getDraftTweet(id: string, userId: string): Promise<DraftTweet | null> {
    const tweet = await this.prisma.draft_tweets.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    return tweet ? this.adaptDraftTweet(tweet) : null;
  }

  // Get user's draft tweets (without thread)
  async getUserDraftTweets(userId: string): Promise<DraftTweet[]> {
    const tweets = await this.prisma.draft_tweets.findMany({
      where: {
        userId: userId,
        threadId: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tweets.map((tweet) => this.adaptDraftTweet(tweet));
  }

  async getUserDraftTweetsByTeam(
    userId: string,
    teamId: string
  ): Promise<DraftTweet[]> {
    const tweets = await this.prisma.draft_tweets.findMany({
      where: {
        userId: userId,
        teamId: teamId,
        // For regular users, only show their own unsubmitted drafts
        OR: [
          { isSubmitted: false },
          { status: { not: "pending_approval" } }, // Show approved/rejected but not pending
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tweets.map((tweet) => this.adaptDraftTweet(tweet));
  }

  async getTeamPendingApprovalTweets(teamId: string): Promise<DraftTweet[]> {
    const tweets = await this.prisma.draft_tweets.findMany({
      where: {
        teamId: teamId,
        status: "pending_approval",
        isSubmitted: true,
        threadId: null, // Only standalone tweets
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tweets.map((tweet) => this.adaptDraftTweet(tweet));
  }

  async getAllUserSubmittedTweets(userId: string): Promise<DraftTweet[]> {
    const tweets = await this.prisma.draft_tweets.findMany({
      where: {
        userId: userId,
        isSubmitted: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tweets.map((tweet) => this.adaptDraftTweet(tweet));
  }

  // Delete a draft tweet
  async deleteDraftTweet(id: string, userId: string): Promise<void> {
    await this.prisma.draft_tweets.delete({
      where: {
        id: id,
        userId: userId,
      },
    });
  }

  // for submitting a tweet for approval
  async submitTweetForApproval(
    id: string,
    userId: string,
    approvalId: string
  ): Promise<void> {
    await this.prisma.draft_tweets.update({
      where: {
        id,
        userId,
      },
      data: {
        status: "pending_approval",
        approvalId,
        isSubmitted: true,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // Add methods for handling approval outcomes
  async approveTweet(id: string, userId: string): Promise<void> {
    await this.prisma.draft_tweets.update({
      where: {
        id,
        userId,
      },
      data: {
        status: "approved",
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async rejectTweet(
    id: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.draft_tweets.update({
      where: {
        id,
        userId,
      },
      data: {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || null,
        updatedAt: new Date().toISOString(),
      },
    });
  }
}

// Helper function to create the service with a singleton-like approach
export function createDraftTweetsService(prismaClient?: PrismaClient) {
  const client = prismaClient || new PrismaClient();
  return new PrismaDraftTweetsService(client);
}
