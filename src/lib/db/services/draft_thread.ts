import { PrismaClient } from "@prisma/client";
import { DraftThread, DraftTweet } from "../schema";
import { TweetStatus } from "@/types/tweet";

export class PrismaDraftThreadsService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // Adapter method to convert Prisma result to DraftThread
  private adaptDraftThread(thread: any): DraftThread {
    return {
      id: thread.id,
      tweetIds: JSON.parse(thread.tweetIds),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      status: thread.status,
      tags: thread.tags ? JSON.parse(thread.tags) : [],
      userId: thread.userId,
    };
  }

  // Adapter method to convert Prisma tweet to DraftTweet
  private adaptDraftTweet(tweet: any): DraftTweet {
    return {
      id: tweet.id,
      content: tweet.content,
      mediaIds: tweet.mediaIds ? JSON.parse(tweet.mediaIds) : [],
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      status: this.convertStatus(tweet.status),
      threadId: tweet.threadId || undefined,
      position: tweet.position || undefined,
      tags: tweet.tags ? JSON.parse(tweet.tags) : [],
      userId: tweet.userId,
    };
  }

  // Convert status string to TweetStatus
  private convertStatus(status: string): TweetStatus {
    const validStatuses: TweetStatus[] = ["draft", "scheduled", "published"];
    return validStatuses.includes(status as TweetStatus)
      ? (status as TweetStatus)
      : "draft";
  }

  // Save a draft thread with its tweets
  async saveDraftThread(
    thread: DraftThread,
    tweets: DraftTweet[]
  ): Promise<void> {
    // Use a transaction to ensure atomic operation
    await this.prisma.$transaction(async (prisma) => {
      // Save the thread
      await prisma.draft_threads.upsert({
        where: { id: thread.id },
        update: {
          tweetIds: JSON.stringify(thread.tweetIds),
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          status: thread.status,
          tags: JSON.stringify(thread.tags || []),
          userId: thread.userId,
          teamId: thread.teamId || null,
          isSubmitted: thread.isSubmitted || false,
          approvalId: thread.approvalId || null,
          approvedAt: thread.approvedAt || null,
          rejectedAt: thread.rejectedAt || null,
          rejectionReason: thread.rejectionReason || null,
        },
        create: {
          id: thread.id,
          tweetIds: JSON.stringify(thread.tweetIds),
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          status: thread.status,
          tags: JSON.stringify(thread.tags || []),
          userId: thread.userId,
          teamId: thread.teamId || null,
          isSubmitted: thread.isSubmitted || false,
          approvalId: thread.approvalId || null,
          approvedAt: thread.approvedAt || null,
          rejectedAt: thread.rejectedAt || null,
          rejectionReason: thread.rejectionReason || null,
        },
      });

      // Save or update each tweet in the thread
      for (const tweet of tweets) {
        await prisma.draft_tweets.upsert({
          where: { id: tweet.id },
          update: {
            content: tweet.content,
            mediaIds: JSON.stringify(tweet.mediaIds || []),
            createdAt: tweet.createdAt,
            updatedAt: tweet.updatedAt,
            status: tweet.status,
            threadId: thread.id,
            position: tweet.position || null,
            tags: JSON.stringify(tweet.tags || []),
            userId: tweet.userId,
            teamId: thread.teamId || null, // Use thread's teamId
            isSubmitted: thread.isSubmitted || false, // Use thread's submission status
          },
          create: {
            id: tweet.id,
            content: tweet.content,
            mediaIds: JSON.stringify(tweet.mediaIds || []),
            createdAt: tweet.createdAt,
            updatedAt: tweet.updatedAt,
            status: tweet.status,
            threadId: thread.id,
            position: tweet.position || null,
            tags: JSON.stringify(tweet.tags || []),
            userId: tweet.userId,
            teamId: thread.teamId || null, // Use thread's teamId
            isSubmitted: thread.isSubmitted || false, // Use thread's submission status
          },
        });
      }
    });
  }

  // Get a specific draft thread with its tweets
  async getDraftThread(
    id: string,
    userId: string
  ): Promise<{ thread: DraftThread; tweets: DraftTweet[] } | null> {
    // First, find the thread
    const thread = await this.prisma.draft_threads.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!thread) return null;

    // Then, find associated tweets
    const tweets = await this.prisma.draft_tweets.findMany({
      where: {
        threadId: id,
        userId: userId,
      },
      orderBy: {
        position: "asc",
      },
    });

    return {
      thread: this.adaptDraftThread(thread),
      tweets: tweets.map((tweet) => this.adaptDraftTweet(tweet)),
    };
  }

  // Get user's draft threads
  async getUserDraftThreads(
    userId: string
  ): Promise<{ thread: DraftThread; tweets: DraftTweet[] }[]> {
    // Find all threads for the user
    const threads = await this.prisma.draft_threads.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // For each thread, find its tweets
    const threadsWithTweets = await Promise.all(
      threads.map(async (thread) => {
        const tweets = await this.prisma.draft_tweets.findMany({
          where: {
            threadId: thread.id,
            userId: userId,
          },
          orderBy: {
            position: "asc",
          },
        });

        return {
          thread: this.adaptDraftThread(thread),
          tweets: tweets.map((tweet) => this.adaptDraftTweet(tweet)),
        };
      })
    );

    return threadsWithTweets;
  }

  async getUserDraftThreadsByTeam(
    userId: string,
    teamId: string
  ): Promise<{ thread: DraftThread; tweets: DraftTweet[] }[]> {
    // Find all threads for the user and specific team
    const threads = await this.prisma.draft_threads.findMany({
      where: {
        userId: userId,
        teamId: teamId,
        // For regular users, only show their own unsubmitted drafts or non-pending ones
        OR: [{ isSubmitted: false }, { status: { not: "pending_approval" } }],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // For each thread, find its tweets
    const threadsWithTweets = await Promise.all(
      threads.map(async (thread) => {
        const tweets = await this.prisma.draft_tweets.findMany({
          where: {
            threadId: thread.id,
            userId: userId,
          },
          orderBy: {
            position: "asc",
          },
        });

        return {
          thread: this.adaptDraftThread(thread),
          tweets: tweets.map((tweet) => this.adaptDraftTweet(tweet)),
        };
      })
    );

    return threadsWithTweets;
  }

  async getTeamPendingApprovalThreads(
    teamId: string
  ): Promise<{ thread: DraftThread; tweets: DraftTweet[] }[]> {
    // Find all pending approval threads for the team
    const threads = await this.prisma.draft_threads.findMany({
      where: {
        teamId: teamId,
        status: "pending_approval",
        isSubmitted: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // For each thread, find its tweets
    const threadsWithTweets = await Promise.all(
      threads.map(async (thread) => {
        const tweets = await this.prisma.draft_tweets.findMany({
          where: {
            threadId: thread.id,
          },
          orderBy: {
            position: "asc",
          },
        });

        return {
          thread: this.adaptDraftThread(thread),
          tweets: tweets.map((tweet) => this.adaptDraftTweet(tweet)),
        };
      })
    );

    return threadsWithTweets;
  }

  // Delete a draft thread and its associated tweets
  async deleteDraftThread(id: string, userId: string): Promise<void> {
    // Use a transaction to ensure atomic deletion
    await this.prisma.$transaction([
      // First, delete all tweets in the thread
      this.prisma.draft_tweets.deleteMany({
        where: {
          threadId: id,
          userId: userId,
        },
      }),
      // Then, delete the thread itself
      this.prisma.draft_threads.delete({
        where: {
          id: id,
          userId: userId,
        },
      }),
    ]);
  }

  async submitThreadForApproval(
    id: string,
    userId: string,
    approvalId: string
  ): Promise<void> {
    await this.prisma.draft_threads.update({
      where: {
        id,
        userId,
      },
      data: {
        status: "pending_approval",
        approvalId,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // Add these methods as well for consistency with the tweet service
  async approveThread(id: string, userId: string): Promise<void> {
    await this.prisma.draft_threads.update({
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

  async rejectThread(
    id: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.draft_threads.update({
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
export function createDraftThreadsService(prismaClient?: PrismaClient) {
  const client = prismaClient || new PrismaClient();
  return new PrismaDraftThreadsService(client);
}
