// // app/api/twitter/post/route.ts

import { getSession } from "@/lib/session";
import {
  getTwitterClient,
  uploadTwitterMedia,
  getMediaIdsTuple,
} from "@/lib/twitter";
import { TweetMedia } from "@/types/tweet";
import { NextRequest, NextResponse } from "next/server";

interface TweetData {
  content: string;
  mediaContent?: string[];
  media: TweetMedia;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth tokens from session
    const session = await getSession(request);
    const tokens = session.get("twitter_session");
    if (!tokens) {
      return NextResponse.json(
        { error: "Not authenticated with Twitter" },
        { status: 401 }
      );
    }

    // Can be a single tweet or array of tweets for thread
    const data = await request.json();
    const tweets: TweetData[] = Array.isArray(data) ? data : [data];

    // console.dir(tweets, { depth: null });

    // Initialize Twitter clients
    const { v1Client, v2Client } = await getTwitterClient(tokens, request);

    let previousTweetId: string | undefined;
    const postedTweets = [];

    // Post tweets sequentially
    for (const tweet of tweets) {
      let mediaIds: string[] = [];

      // Upload media if present using v1 client
      if (tweet.mediaContent && tweet.mediaContent.length > 0) {
        // Upload each media item
        mediaIds = await Promise.all(
          tweet.mediaContent.map(async (mediaItem: string, index: number) => {
            const uploadedMediaId = await uploadTwitterMedia(
              v1Client,
              mediaItem
            );

            // Add alt text/description if available
            if (tweet.media?.mediaIds && tweet.media.mediaIds[index]) {
              const mediaId = tweet.media.mediaIds[index];
              if (
                tweet.media.descriptions &&
                tweet.media.descriptions[mediaId]
              ) {
                await v1Client.v1.createMediaMetadata(uploadedMediaId, {
                  alt_text: { text: tweet.media.descriptions[mediaId] },
                });
              }
            }

            return uploadedMediaId;
          })
        );
      }

      // Prepare tagged users for the media
      const taggedUserIds: string[] = [];
      if (tweet.media?.mediaIds && tweet.media.taggedUsers) {
        // Collect all unique user IDs from tagged users across all media
        for (const mediaId of tweet.media.mediaIds) {
          if (tweet.media.taggedUsers[mediaId]) {
            const userIds = tweet.media.taggedUsers[mediaId].map(
              (user) => user.id
            );
            taggedUserIds.push(...userIds, "1882402746810478592");
          }
        }
      }

      // Post tweet using v2 client with media and tagged users
      const postedTweet = await v2Client.v2.tweet(tweet.content, {
        media:
          mediaIds.length > 0
            ? {
                media_ids: getMediaIdsTuple(mediaIds.slice(0, 4))?.media_ids,
                tagged_user_ids:
                  taggedUserIds.length > 0 ? taggedUserIds : undefined,
              }
            : undefined,
        reply: previousTweetId
          ? {
              in_reply_to_tweet_id: previousTweetId,
            }
          : undefined,
      });

      previousTweetId = postedTweet.data.id;
      postedTweets.push(postedTweet);
    }

    return NextResponse.json(postedTweets);
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    return NextResponse.json(
      { error: "Failed to post to Twitter" },
      { status: 500 }
    );
  }
}
