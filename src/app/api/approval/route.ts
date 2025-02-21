// /app/api/approval/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  contentApprovalsService,
  sharedDraftsService,
} from "@/lib/services";
import { nanoid } from "nanoid";

// Helper to get user data from session
async function getUserData(request: NextRequest) {
  const session = await getSession(request);
  const twitterSession = session.get("twitter_session");

  if (!twitterSession) return null;

  try {
    const sessionData = JSON.parse(twitterSession);
    return {
      userId: sessionData.userData?.id,
      tokens: sessionData.tokens,
      userData: sessionData.userData,
    };
  } catch (error) {
    console.error("Error parsing session:", error);
    return null;
  }
}

// Submit content for approval
export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, contentHash, publicKey } = body;

    if (!contentHash) {
      return NextResponse.json(
        { error: "Content hash is required" },
        { status: 400 }
      );
    }

    // Determine if it's a tweet or thread and fetch it
    let content;
    let threadData;
    if (type === "tweet") {
      content = await draftTweetsService.getDraftTweet(id, userData.userId);
      if (!content) {
        return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
      }
    } else if (type === "thread") {
      threadData = await draftThreadsService.getDraftThread(
        id,
        userData.userId
      );
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

    // Create local approval record
    const approval = await contentApprovalsService.createApproval({
      contentType: type,
      contentId: id,
      blockchainId: contentHash,
      submittedAt: new Date().toISOString(),
      status: "pending",
      requiredApprovals: 3, // This could be configured elsewhere
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

    // Check if there's already a shared draft for this content
    let sharedDraft = await sharedDraftsService.getSharedDraftInfo(id);
    let sharedDraftToken = sharedDraft?.accessToken;

    // If no shared draft exists, create one
    if (!sharedDraft) {
      // Create a shared draft record with an expiration date in the future
      const expirationDays = 14; // 2 weeks for review
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

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

    // Return success response with approval and shared draft IDs
    return NextResponse.json({
      success: true,
      status: "pending_approval",
      approvalId: approval.id,
      shareLink: `${baseUrl}/shared/${sharedDraftToken}`,
      sharedDraftToken: sharedDraftToken,
    });
  } catch (error) {
    console.error("Error submitting for approval:", error);
    return NextResponse.json(
      { error: "Failed to submit for approval" },
      { status: 500 }
    );
  }
}

// Get approval status
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
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate user owns the content or is an admin
    // For now, just check if the user owns it
    let isOwner = false;
    if (type === "tweet") {
      const tweet = await draftTweetsService.getDraftTweet(
        contentId,
        userData.userId
      );
      isOwner = !!tweet;
    } else if (type === "thread") {
      const thread = await draftThreadsService.getDraftThread(
        contentId,
        userData.userId
      );
      isOwner = !!thread;
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Get approval status
    const approval = await contentApprovalsService.getApprovalByContentId(
      contentId
    );
    if (!approval) {
      return NextResponse.json(
        { error: "No approval record found" },
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

// For testing purposes - update approval status
export async function PATCH(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { approvalId, status, approvers } = body;

    if (!approvalId || !status) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await contentApprovalsService.updateApprovalStatus(approvalId, status, {
      currentApprovals: approvers?.length || 0,
      approvers: approvers || [],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
