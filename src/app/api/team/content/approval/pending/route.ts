// // /app/api/team/content/approval/pending/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getUserData } from "@/lib/session";
// import {
//   draftTweetsService,
//   draftThreadsService,
//   contentApprovalsService,
//   teamInvitesService,
//   sharedDraftsService,
// } from "@/lib/services";

// export async function GET(req: NextRequest) {
//   try {
//     const userData = await getUserData(req);
//     if (!userData) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const teamId = searchParams.get("teamId");
//     const creatorId = searchParams.get("creatorId");

//     // Set default to user's team ID if neither parameter is provided
//     const finalTeamId = teamId || userData.userId;

//     // Validate permissions - ensure user is a member of the team
//     if (teamId) {
//       const isMember = await teamInvitesService.getUserTeams(userData.userId);
//       const belongsToTeam = isMember.some(
//         (membership) => membership.teamId === teamId
//       );

//       if (!belongsToTeam) {
//         return NextResponse.json(
//           { error: "You are not a member of this team" },
//           { status: 403 }
//         );
//       }
//     }

//     // Construct base URL for shared links
//     const baseUrl =
//       process.env.NEXT_PUBLIC_BASE_URL ||
//       `${req.nextUrl.protocol}//${req.nextUrl.host}`;

//     // Get pending tweets and threads
//     let pendingTweets = [];
//     let pendingThreads = [];

//     if (creatorId) {
//       // If creatorId is specified, get content submitted by this user
//       // This branch is for viewing "my submissions"
//       const tweets = await draftTweetsService.getUserDraftTweetsByTeam(
//         creatorId,
//         finalTeamId
//       );
//       const threads = await draftThreadsService.getUserDraftThreadsByTeam(
//         creatorId,
//         finalTeamId
//       );

//       pendingTweets = tweets.filter(
//         (tweet) => tweet.status === "pending_approval"
//       );
//       pendingThreads = threads.filter(
//         (threadData) => threadData.thread.status === "pending_approval"
//       );
//     } else {
//       // Get all pending content for the team
//       // This is for team admins viewing all pending approvals
//       pendingTweets =
//         await draftTweetsService.getTeamPendingApprovalTweets(finalTeamId);
//       pendingThreads =
//         await draftThreadsService.getTeamPendingApprovalThreads(finalTeamId);
//     }

//     // For each item, get approval information and shared draft info
//     // Process tweets
//     const tweetsWithMeta = await Promise.all(
//       pendingTweets.map(async (tweet) => {
//         // Get approval details
//         const approval = await contentApprovalsService.getApprovalByContentId(
//           tweet.id
//         );

//         // Get shared draft info if available
//         const sharedDraft = await sharedDraftsService.getSharedDraftInfo(
//           tweet.id
//         );

//         // Add metadata to tweet
//         return {
//           ...tweet,
//           approval,
//           shareLink: sharedDraft
//             ? `${baseUrl}/shared/${sharedDraft.accessToken}`
//             : null,
//           sharedDraftToken: sharedDraft?.accessToken || null,
//           authorData: await getUserDetails(tweet.userId),
//         };
//       })
//     );

//     // Process threads
//     const threadsWithMeta = await Promise.all(
//       pendingThreads.map(async (threadData) => {
//         const approval = await contentApprovalsService.getApprovalByContentId(
//           threadData.thread.id
//         );

//         const sharedDraft = await sharedDraftsService.getSharedDraftInfo(
//           threadData.thread.id
//         );

//         return {
//           ...threadData,
//           approval,
//           shareLink: sharedDraft
//             ? `${baseUrl}/shared/${sharedDraft.accessToken}`
//             : null,
//           sharedDraftToken: sharedDraft?.accessToken || null,
//           authorData: await getUserDetails(threadData.thread.userId),
//         };
//       })
//     );

//     return NextResponse.json({
//       tweets: tweetsWithMeta,
//       threads: threadsWithMeta,
//     });
//   } catch (error) {
//     console.error("Error fetching pending approvals:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch pending approvals" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to get user details
// async function getUserDetails(userId: string) {
//   try {
//     // Get user details from database
//     const prismaDb = (await import("@/lib/db/prisma_service")).prismaDb;
//     const userDetails = await prismaDb.user_tokens.findUnique({
//       where: { userId },
//       select: {
//         name: true,
//         username: true,
//         profileImageUrl: true,
//         verified: true,
//         verifiedType: true,
//       },
//     });

//     return (
//       userDetails || {
//         name: "Unknown",
//         username: "unknown",
//         profileImageUrl: null,
//         verified: false,
//       }
//     );
//   } catch (error) {
//     console.error("Error fetching user details:", error);
//     return {
//       name: "Unknown",
//       username: "unknown",
//       profileImageUrl: null,
//       verified: false,
//     };
//   }
// }

// /app/api/team/content/approval/pending/route.ts
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
    const teamId = searchParams.get("teamId");

    // Set default to user's team ID if no parameter is provided
    const finalTeamId = teamId || userData.userId;

    // Validate permissions in a single query
    if (teamId) {
      const memberCheck = await prismaDb.team_members.findFirst({
        where: {
          teamId: finalTeamId,
          userId: userData.userId,
        },
      });

      if (!memberCheck) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 403 }
        );
      }
    }

    // Construct base URL for shared links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Use a transaction for all database operations to reduce connections
    const results = await prismaDb.$transaction(async (tx) => {
      // 1. Get pending tweets and threads in a single batch
      const [pendingTweets, pendingThreads] = await Promise.all([
        // Get pending tweets with user info in a single query
        tx.draft_tweets.findMany({
          where: {
            teamId: finalTeamId,
            status: "pending_approval",
            isSubmitted: true,
            threadId: null, // Standalone tweets only
          },
          include: {
            user: {
              select: {
                name: true,
                username: true,
                profileImageUrl: true,
                verified: true,
                verifiedType: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),

        // Get pending threads with associated tweets in a single query
        tx.draft_threads.findMany({
          where: {
            teamId: finalTeamId,
            status: "pending_approval",
            isSubmitted: true,
          },
          include: {
            user: {
              select: {
                name: true,
                username: true,
                profileImageUrl: true,
                verified: true,
                verifiedType: true,
              },
            },
            tweets: {
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
      ]);

      // 2. Get all content IDs for lookup
      const contentIds = [
        ...pendingTweets.map((t) => t.id),
        ...pendingThreads.map((t) => t.id),
      ];

      // 3. Get all approvals and shared drafts in bulk
      const [approvals, sharedDrafts] = await Promise.all([
        tx.content_approvals.findMany({
          where: {
            contentId: {
              in: contentIds,
            },
          },
        }),

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

      // Create lookup maps
      const approvalMap = new Map();
      const sharedDraftMap = new Map();

      approvals.forEach((approval) => {
        approvalMap.set(approval.contentId, approval);
      });

      sharedDrafts.forEach((draft) => {
        sharedDraftMap.set(draft.draftId, draft);
      });

      return {
        pendingTweets,
        pendingThreads,
        approvalMap,
        sharedDraftMap,
      };
    });

    // Process tweets
    const tweetsWithMeta = results.pendingTweets.map((tweet) => {
      // Get associated data
      const approval = results.approvalMap.get(tweet.id);
      const sharedDraft = results.sharedDraftMap.get(tweet.id);

      return {
        id: tweet.id,
        content: tweet.content,
        mediaIds: tweet.mediaIds ? JSON.parse(tweet.mediaIds) : [],
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
        status: tweet.status,
        userId: tweet.userId,
        teamId: tweet.teamId,

        // Author data
        authorData: {
          name: tweet.user.name,
          username: tweet.user.username,
          profileImageUrl: tweet.user.profileImageUrl,
          verified: tweet.user.verified,
          verifiedType: tweet.user.verifiedType,
        },

        // Approval and sharing info
        approval: approval || null,
        shareLink: sharedDraft
          ? `${baseUrl}/shared/${sharedDraft.accessToken}`
          : null,
        sharedDraftToken: sharedDraft?.accessToken || null,
      };
    });

    // Process threads
    const threadsWithMeta = results.pendingThreads.map((thread) => {
      // Get associated data
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
          mediaIds: tweet.mediaIds ? JSON.parse(tweet.mediaIds) : [],
          createdAt: tweet.createdAt,
          updatedAt: tweet.updatedAt,
          status: tweet.status,
          threadId: tweet.threadId,
          position: tweet.position || 0,
          tags: tweet.tags ? JSON.parse(tweet.tags) : [],
          userId: tweet.userId,
        })),

        // Author data
        authorData: {
          name: thread.user.name,
          username: thread.user.username,
          profileImageUrl: thread.user.profileImageUrl,
          verified: thread.user.verified,
          verifiedType: thread.user.verifiedType,
        },

        // Approval and sharing info
        approval: approval || null,
        shareLink: sharedDraft
          ? `${baseUrl}/shared/${sharedDraft.accessToken}`
          : null,
        sharedDraftToken: sharedDraft?.accessToken || null,
      };
    });

    return NextResponse.json({
      tweets: tweetsWithMeta,
      threads: threadsWithMeta,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pending approvals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
