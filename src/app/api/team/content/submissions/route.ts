// /app/api/team/content/submissions/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";

export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "pending_approval", "approved", "rejected", "all"

    // Default to the user's ID as creator
    const creatorId = userData.userId;

    // Construct base URL for shared links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Build the status filter condition
    const statusFilter = status && status !== "all" ? { status: status } : {};

    // IMPORTANT: Use a single transaction with efficient queries
    // This reduces the number of connections and round trips
    const results = await prismaDb.$transaction(async (tx) => {
      // 1. Get tweets and threads in a single query batch
      const [tweets, threads, userTeams] = await Promise.all([
        // Get tweets with team information in a single JOIN query
        tx.draft_tweets.findMany({
          where: {
            userId: creatorId,
            isSubmitted: true,
            ...statusFilter,
          },
          orderBy: {
            updatedAt: "desc",
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),

        // Get threads with team information in a single JOIN query
        tx.draft_threads.findMany({
          where: {
            userId: creatorId,
            isSubmitted: true,
            ...statusFilter,
          },
          orderBy: {
            updatedAt: "desc",
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            tweets: {
              orderBy: {
                position: "asc",
              },
            },
          },
        }),

        // Get user's team memberships
        tx.team_members.findMany({
          where: {
            userId: creatorId,
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      // 2. Get all content IDs for lookup of approvals and shared drafts
      const contentIds = [
        ...tweets.map((t) => t.id),
        ...threads.map((t) => t.id),
      ];

      // 3. Get all approval records and shared drafts in bulk
      const [approvals, sharedDrafts] = await Promise.all([
        // Get all approvals in a single query
        tx.content_approvals.findMany({
          where: {
            contentId: {
              in: contentIds,
            },
          },
        }),

        // Get all shared drafts in a single query
        tx.shared_drafts.findMany({
          where: {
            draftId: {
              in: contentIds,
            },
            shareState: "active",
            expiresAt: {
              gt: new Date().toISOString(),
            },
          },
        }),
      ]);

      // Create lookup maps for efficient access
      const approvalMap = new Map();
      const sharedDraftMap = new Map();

      approvals.forEach((approval) => {
        approvalMap.set(approval.contentId, approval);
      });

      sharedDrafts.forEach((draft) => {
        sharedDraftMap.set(draft.draftId, draft);
      });

      // Return all the data we need
      return {
        tweets,
        threads,
        approvalMap,
        sharedDraftMap,
        userTeams,
      };
    });

    // Process tweets with combined data
    const tweetsWithMeta = results.tweets.map((tweet) => {
      // Get associated data from our maps
      const approval = results.approvalMap.get(tweet.id);
      const sharedDraft = results.sharedDraftMap.get(tweet.id);

      return {
        id: tweet.id,
        content: tweet.content,
        media: tweet.mediaMetadata
          ? JSON.parse(tweet.mediaMetadata)
          : undefined,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
        status: tweet.status,
        userId: tweet.userId,
        teamId: tweet.teamId,
        teamName: tweet.team?.name || "Personal",

        // Include approval and sharing info
        approval: approval || null,
        shareLink: sharedDraft
          ? `${baseUrl}/shared/${sharedDraft.accessToken}`
          : null,
        sharedDraftToken: sharedDraft?.accessToken || null,

        // Additional metadata
        submissionDate: approval?.submittedAt || tweet.updatedAt,
        rejectionReason: tweet.rejectionReason || approval?.rejectionReason,
      };
    });

    // Process threads with combined data
    const threadsWithMeta = results.threads.map((thread) => {
      // Get associated data from our maps
      const approval = results.approvalMap.get(thread.id);
      const sharedDraft = results.sharedDraftMap.get(thread.id);

      return {
        thread: {
          id: thread.id,
          tweetIds: JSON.parse(thread.tweetIds),
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          status: thread.status,
          tags: thread.tags ? JSON.parse(thread.tags) : [],
          userId: thread.userId,
          teamId: thread.teamId,
        },
        tweets: thread.tweets.map((tweet) => ({
          id: tweet.id,
          content: tweet.content,
          media: tweet.mediaMetadata
            ? JSON.parse(tweet.mediaMetadata)
            : undefined,
          createdAt: tweet.createdAt,
          updatedAt: tweet.updatedAt,
          status: tweet.status,
          threadId: tweet.threadId,
          position: tweet.position || 0,
          tags: tweet.tags ? JSON.parse(tweet.tags) : [],
          userId: tweet.userId,
        })),

        // Include team info
        teamName: thread.team?.name || "Personal",

        // Include approval and sharing info
        approval: approval || null,
        shareLink: sharedDraft
          ? `${baseUrl}/shared/${sharedDraft.accessToken}`
          : null,
        sharedDraftToken: sharedDraft?.accessToken || null,

        // Additional metadata
        submissionDate: approval?.submittedAt || thread.updatedAt,
        rejectionReason: thread.rejectionReason || approval?.rejectionReason,
      };
    });

    return NextResponse.json({
      tweets: tweetsWithMeta,
      threads: threadsWithMeta,
    });
  } catch (error) {
    console.error("Error fetching creator submissions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch submissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
