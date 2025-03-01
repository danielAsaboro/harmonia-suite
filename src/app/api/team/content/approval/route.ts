// /app/api/team/content/approval/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  contentApprovalsService,
  teamInvitesService,
  sharedDraftsService,
} from "@/lib/services";
import { nanoid } from "nanoid";

/**
 * POST - Submit content for team approval
 *
 * This endpoint allows team members to submit tweets or threads for review by team admins.
 * It creates an approval record and updates the content status to "pending_approval".
 */
export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, teamId, contentHash } = body;

    // Validate required fields
    if (!type || !id || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, and teamId are required" },
        { status: 400 }
      );
    }

    // Verify the user is a member of this team
    const isMember = await teamInvitesService.getUserTeams(userData.userId);
    const belongsToTeam = isMember.some(
      (membership) => membership.teamId === teamId
    );

    if (!belongsToTeam) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Determine if it's a tweet or thread and fetch it
    let content;
    let threadData;
    console.log("=========");
    console.dir({ type, id, teamId, contentHash }, { depth: null });
    console.log("=========");

    if (type === "tweet") {
      content = await draftTweetsService.getDraftTweet(id, userData.userId);

      console.log(" printing tweet to drafts in approval stage: ", content);
      if (!content) {
        return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
      }
    } else if (type === "thread") {
      threadData = await draftThreadsService.getDraftThread(
        id,
        userData.userId
      );
      console.log(" printing thread to drafts in approval stage: ", threadData);
      if (!threadData) {
        return NextResponse.json(
          { error: "Thread not found" },
          { status: 404 }
        );
      }
      content = threadData.thread;
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Generate a content hash if not provided
    const finalContentHash = contentHash || nanoid();

    // Create approval record
    const approval = await contentApprovalsService.createApproval({
      contentType: type,
      contentId: id,
      blockchainId: finalContentHash,
      submittedAt: new Date().toISOString(),
      status: "pending",
      requiredApprovals: 1, // Simplified to 1 required approval
      currentApprovals: 0,
      approvers: [],
      transactionSignature: body.transactionSignature || null,
    });

    // Update content status
    if (type === "tweet") {
      await draftTweetsService.submitTweetForApproval(
        id,
        userData.userId,
        approval.id
      );
    } else {
      await draftThreadsService.submitThreadForApproval(
        id,
        userData.userId,
        approval.id
      );
    }

    // Create or get existing shared draft for review
    let sharedDraft = await sharedDraftsService.getSharedDraftInfo(id);
    let sharedDraftToken = sharedDraft?.accessToken;

    // If no shared draft exists, create one
    if (!sharedDraft) {
      // Set expiration to 2 weeks from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      // Create shared draft with review capabilities
      sharedDraftToken = nanoid(32);

      const newSharedDraft = {
        id: nanoid(),
        draftId: id,
        draftType: type,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        canComment: true, // Allow reviewers to comment
        creatorId: userData.userId,
        accessToken: sharedDraftToken,
        shareState: "active" as const,
        authorName: userData.userData.name,
        authorHandle: userData.userData.username,
        authorProfileUrl: userData.userData.profile_image_url,
      };

      await sharedDraftsService.createSharedDraft(newSharedDraft);
    }

    // Construct base URL for shared links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Return success response
    return NextResponse.json({
      success: true,
      status: "pending_approval",
      approvalId: approval.id,
      shareLink: `${baseUrl}/shared/${sharedDraftToken}`,
      sharedDraftToken: sharedDraftToken,
      teamId: teamId,
    });
  } catch (error) {
    console.error("Error submitting for approval:", error);
    return NextResponse.json(
      {
        error: "Failed to submit for approval",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch pending approvals
 *
 * Returns all content pending approval for a specific team.
 * Admin-only endpoint.
 */
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

    // For each item, get the approval information and shared draft link if available
    const pendingTweetsWithMeta = await Promise.all(
      pendingTweets.map(async (tweet) => {
        const approval = await contentApprovalsService.getApprovalByContentId(
          tweet.id
        );
        const sharedDraft = await sharedDraftsService.getSharedDraftInfo(
          tweet.id
        );

        // Construct base URL for shared links
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          `${req.nextUrl.protocol}//${req.nextUrl.host}`;

        return {
          ...tweet,
          approval,
          shareLink: sharedDraft
            ? `${baseUrl}/shared/${sharedDraft.accessToken}`
            : null,
        };
      })
    );

    const pendingThreadsWithMeta = await Promise.all(
      pendingThreads.map(async (threadData) => {
        const approval = await contentApprovalsService.getApprovalByContentId(
          threadData.thread.id
        );
        const sharedDraft = await sharedDraftsService.getSharedDraftInfo(
          threadData.thread.id
        );

        // Construct base URL for shared links
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          `${req.nextUrl.protocol}//${req.nextUrl.host}`;

        return {
          ...threadData,
          approval,
          shareLink: sharedDraft
            ? `${baseUrl}/shared/${sharedDraft.accessToken}`
            : null,
        };
      })
    );

    return NextResponse.json({
      tweets: pendingTweetsWithMeta,
      threads: pendingThreadsWithMeta,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Approve or reject content
 *
 * Handles approval or rejection of content by team admins.
 * Updates content status and approval records accordingly.
 */
export async function PATCH(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, contentId, contentType, teamId, rejectionReason } = body;

    // Validate request
    if (!action || !contentId || !contentType || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Only team admins can approve or reject content" },
        { status: 403 }
      );
    }

    // Get the approval record
    const approval =
      await contentApprovalsService.getApprovalByContentId(contentId);
    if (!approval) {
      return NextResponse.json(
        { error: "No approval record found for this content" },
        { status: 404 }
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

      // Update approval record
      await contentApprovalsService.updateApprovalStatus(
        approval.id,
        "approved",
        {
          currentApprovals: 1,
          approvers: [userData.userId],
        }
      );

      return NextResponse.json({
        success: true,
        message: `${contentType} approved successfully`,
        status: "approved",
      });
    } else if (action === "reject") {
      // Ensure there's a rejection reason
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

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

      // Update approval record
      await contentApprovalsService.updateApprovalStatus(
        approval.id,
        "rejected",
        {
          rejectionReason,
        }
      );

      return NextResponse.json({
        success: true,
        message: `${contentType} rejected successfully`,
        status: "rejected",
        reason: rejectionReason,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error handling approval action:", error);
    return NextResponse.json(
      { error: "Failed to process approval action" },
      { status: 500 }
    );
  }
}
