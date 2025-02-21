// /app/api/verify-tweet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { extractTweetId } from "@/lib/twitter";
// import { db } from "@/lib/db"; // Assuming you have a database connection setup

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract tweet ID from URL
    const tweetId = extractTweetId(url);

    if (!tweetId) {
      return NextResponse.json(
        { error: "Invalid Twitter URL" },
        { status: 400 }
      );
    }

    // Query your database to check if this tweet was published through your platform
    // const tweet = await db.tweet.findFirst({
    //   where: {
    //     // This assumes your tweet table has these fields
    //     id: tweetId,
    //     status: "published",
    //   },
    // });
    const tweet = {
      verified: Math.floor(Math.random() * 100) % 2 === 0,
      tweetId: "string",
      publishedAt: "string | null",
    };

    // return NextResponse.json({
    //   verified: !!tweet.verified,
    //   tweetId,
    //   publishedAt: tweet?.publishedAt || null,
    // });
    return NextResponse.json(tweet);
  } catch (error) {
    console.error("Error verifying tweet:", error);
    return NextResponse.json(
      { error: "Failed to verify tweet" },
      { status: 500 }
    );
  }
}
