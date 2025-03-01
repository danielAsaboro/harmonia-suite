// src/app/api/drafts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserData } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  userTokensService,
  teamInvitesService,
} from "@/lib/services";
import { fileStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await userTokensService.saveUserTokens({
      userId: userData.userId,
      accessToken: userData.tokens.accessToken,
      refreshToken: userData.tokens.refreshToken,
      expiresAt: userData.tokens.expiresAt,
      username: userData.userData.username,
      name: userData.userData.name,
      profileImageUrl: userData.userData.profile_image_url,
    });

    const body = await req.json();
    const { type, data } = body;
    const now = new Date().toISOString();

    // console.dir(
    //   {
    //     type,
    //     data,
    //   },
    //   { depth: null }
    // );

    if (type === "tweet") {
      const tweet = {
        ...data,
        userId: userData.userId,
        createdAt: data.createdAt || now,
        updatedAt: now,
        teamId: data.teamId || null,
        isSubmitted: data.isSubmitted || false,
        media: data.media || null,
      };

      await draftTweetsService.saveDraftTweet(tweet);
      return NextResponse.json(tweet);
    }

    if (type === "thread") {
      const thread = {
        ...data,
        userId: userData.userId,
        createdAt: data.createdAt || now,
        updatedAt: now,
        teamId: data.tweets[0].teamId || null,
        isSubmitted: data.isSubmitted || false,
      };

      const tweets = data.tweets.map((tweet: any) => ({
        ...tweet,
        userId: userData.userId,
        createdAt: tweet.createdAt || now,
        updatedAt: now,
        position: tweet.position,
        teamId: data.teamId || null,
        isSubmitted: data.isSubmitted || false,
        // Only include media, no mediaIds
        media: tweet.media || null,
      }));

      await draftThreadsService.saveDraftThread(thread, tweets);
      return NextResponse.json({ thread, tweets });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// Update the GET handler to filter by team
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const teamId = searchParams.get("teamId"); // Get teamId from query params

    if (type === "tweet" && id) {
      const tweet = await draftTweetsService.getDraftTweet(id, userData.userId);
      return NextResponse.json(tweet);
    }

    if (type === "thread" && id) {
      const thread = await draftThreadsService.getDraftThread(
        id,
        userData.userId
      );
      return NextResponse.json(thread);
    }

    // If teamId is provided, filter by team
    if (teamId) {
      // Check if user is team admin for visibility of pending approvals
      const isAdmin = await teamInvitesService.isTeamAdmin(
        teamId,
        userData.userId
      );

      // Get user's drafts for the team
      const tweets = await draftTweetsService.getUserDraftTweetsByTeam(
        userData.userId,
        teamId
      );

      const threads = await draftThreadsService.getUserDraftThreadsByTeam(
        userData.userId,
        teamId
      );

      // If user is admin, also get pending approval items for this team
      if (isAdmin) {
        const pendingTweets =
          await draftTweetsService.getTeamPendingApprovalTweets(teamId);

        const pendingThreads =
          await draftThreadsService.getTeamPendingApprovalThreads(teamId);

        // Combine user's drafts with pending approvals
        return NextResponse.json({
          tweets: [...tweets, ...pendingTweets],
          threads: [...threads, ...pendingThreads],
        });
      }

      return NextResponse.json({ tweets, threads });
    }

    // If no specific filters, return all user's drafts across teams
    const tweets = await draftTweetsService.getUserDraftTweets(userData.userId);
    const threads = await draftThreadsService.getUserDraftThreads(
      userData.userId
    );

    return NextResponse.json({ tweets, threads });
  } catch (error) {
    console.error("Error getting drafts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const cleanup = searchParams.get("cleanup") === "true";

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id" },
        { status: 400 }
      );
    }

    if (type === "tweet") {
      if (cleanup) {
        // Get tweet's media IDs before deletion
        const tweet = await draftTweetsService.getDraftTweet(
          id,
          userData.userId
        );

        if (tweet && tweet.media?.mediaIds) {
          // Delete media files
          await Promise.allSettled(
            tweet.media?.mediaIds.map(
              async (mediaId: string) =>
                await fileStorage.deleteFile(userData.userId, mediaId)
            )
          );
        }
      }
      await draftTweetsService.deleteDraftTweet(id, userData.userId);
    } else if (type === "thread") {
      if (cleanup) {
        // Get all tweets in thread and their media before deletion
        const threadData = await draftThreadsService.getDraftThread(
          id,
          userData.userId
        );
        if (threadData) {
          const mediaIds = threadData.tweets.flatMap(
            (tweet) => tweet.media?.mediaIds || []
          );

          // Delete all media files
          await Promise.allSettled(
            mediaIds.map((mediaId) =>
              fileStorage.deleteFile(userData.userId, mediaId)
            )
          );
        }
      }
      await draftThreadsService.deleteDraftThread(id, userData.userId);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
