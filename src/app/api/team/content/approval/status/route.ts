// /app/api/team/content/approval/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  contentApprovalsService,
  sharedDraftsService,
  teamInvitesService,
} from "@/lib/services";

/**
 * GET - Check the approval status of content
 *
 * This endpoint allows a user to check the status of content they have submitted for approval.
 * It returns the approval details and shared draft information.
 */
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("id");
    const type = searchParams.get("type");

    if (!contentId || !type) {
      return NextResponse.json(
        { error: "Missing required parameters: id and type" },
        { status: 400 }
      );
    }

    // Verify content exists and user has access to it
    let isOwner = false;
    let isTeamAdmin = false;
    let teamId = null;

    if (type === "tweet") {
      const tweet = await draftTweetsService.getDraftTweet(
        contentId,
        userData.userId
      );
      isOwner = !!tweet;
      if (tweet?.teamId) {
        teamId = tweet.teamId;
      }
    } else if (type === "thread") {
      const thread = await draftThreadsService.getDraftThread(
        contentId,
        userData.userId
      );
      isOwner = !!thread;
      if (thread?.thread.teamId) {
        teamId = thread.thread.teamId;
      }
    }

    // If not the owner, check if user is a team admin (if teamId is available)
    if (!isOwner && teamId) {
      isTeamAdmin = await teamInvitesService.isTeamAdmin(
        teamId,
        userData.userId
      );
    }

    if (!isOwner && !isTeamAdmin) {
      return NextResponse.json(
        {
          error: "Content not found or you don't have permission to view it",
        },
        { status: 404 }
      );
    }

    // Get approval status
    const approval =
      await contentApprovalsService.getApprovalByContentId(contentId);

    if (!approval) {
      return NextResponse.json(
        { error: "No approval record found for this content" },
        { status: 404 }
      );
    }

    // Get shared draft info if it exists
    const sharedDraft = await sharedDraftsService.getSharedDraftInfo(contentId);

    // Construct base URL for shared links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Include shared draft info in response if it exists
    return NextResponse.json({
      ...approval,
      teamId,
      sharedDraft: sharedDraft
        ? {
            token: sharedDraft.accessToken,
            shareLink: `${baseUrl}/shared/${sharedDraft.accessToken}`,
            canComment: sharedDraft.canComment,
            expiresAt: sharedDraft.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching approval status:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval status" },
      { status: 500 }
    );
  }
}
