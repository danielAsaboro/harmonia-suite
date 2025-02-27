// /app/api/team/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserData } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  contentApprovalsService,
  teamInvitesService,
} from "@/lib/services";

// Handle approving or rejecting content
export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, contentId, contentType, teamId, rejectionReason } =
      await req.json();

    // Verify the user is a team admin
    const isAdmin = await teamInvitesService.isTeamAdmin(
      teamId,
      userData.userId
    );
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can approve or reject content" },
        { status: 403 }
      );
    }

    if (action === "approve") {
      // Handle approval
      if (contentType === "tweet") {
        await draftTweetsService.approveTweet(contentId, userData.userId);
      } else if (contentType === "thread") {
        await draftThreadsService.approveThread(contentId, userData.userId);
      } else {
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${contentType} approved successfully`,
      });
    } else if (action === "reject") {
      // Handle rejection
      if (contentType === "tweet") {
        await draftTweetsService.rejectTweet(
          contentId,
          userData.userId,
          rejectionReason
        );
      } else if (contentType === "thread") {
        await draftThreadsService.rejectThread(
          contentId,
          userData.userId,
          rejectionReason
        );
      } else {
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${contentType} rejected successfully`,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling content action:", error);
    return NextResponse.json(
      { error: "Failed to process content action" },
      { status: 500 }
    );
  }
}

// Get pending content for a team
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify the user is a team admin
    const isAdmin = await teamInvitesService.isTeamAdmin(
      teamId,
      userData.userId
    );
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can view pending content" },
        { status: 403 }
      );
    }

    // Get pending tweets and threads for the team
    const pendingTweets =
      await draftTweetsService.getTeamPendingApprovalTweets(teamId);
    const pendingThreads =
      await draftThreadsService.getTeamPendingApprovalThreads(teamId);

    return NextResponse.json({
      tweets: pendingTweets,
      threads: pendingThreads,
    });
  } catch (error) {
    console.error("Error fetching pending content:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending content" },
      { status: 500 }
    );
  }
}
