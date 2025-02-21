// /app/api/approvals/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  draftTweetsService,
  draftThreadsService,
  contentApprovalsService,
} from "@/lib/services";

export async function GET(req: NextRequest) {
  try {
    // Get user from session
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = JSON.parse(twitterSession).userData;
    const userId = userData.id;

    // Get all draft tweets with pending_approval status
    const pendingTweets = await draftTweetsService.getUserDraftTweets(userId);
    const pendingThreads = await draftThreadsService.getUserDraftThreads(
      userId
    );

    // Filter tweets with pending_approval status
    const pendingApprovalTweets = pendingTweets.filter(
      (tweet) => tweet.status === "pending_approval"
    );

    // Filter threads with pending_approval status
    const pendingApprovalThreads = pendingThreads
      .filter((thread) => thread.thread.status === "pending_approval")
      .map((thread) => ({
        thread: thread.thread,
        tweets: thread.tweets,
      }));

    // Return the pending approval content
    return NextResponse.json({
      tweets: pendingApprovalTweets,
      threads: pendingApprovalThreads,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}
