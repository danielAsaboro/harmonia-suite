// app/api/twitter/post/route.ts
import { getSession } from "@/lib/session";
import {
  getTwitterClient,
  uploadTwitterMedia,
  getMediaIdsTuple,
} from "@/lib/twitter";
import { TweetMedia } from "@/types/tweet";
import { NextRequest, NextResponse } from "next/server";
import { userTokensService } from "@/lib/services";

interface TweetData {
  content: string;
  mediaContent?: string[];
  media: TweetMedia;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth tokens from session
    const session = await getSession(request);
    const sessionData = session.get("twitter_session");

    if (!sessionData) {
      return NextResponse.json(
        { error: "Not authenticated with Twitter" },
        { status: 401 }
      );
    }

    // Parse session data to check validity
    try {
      const parsedSession = JSON.parse(sessionData);
      if (!parsedSession.tokens || !parsedSession.userData) {
        return NextResponse.json(
          { error: "Invalid session data. Please log in again." },
          { status: 401 }
        );
      }

      // Check database for fresh tokens
      const dbTokens = await userTokensService.getUserTokens(
        parsedSession.userData.id
      );
      if (!dbTokens) {
        return NextResponse.json(
          { error: "Twitter authentication expired. Please log in again." },
          { status: 401 }
        );
      }
    } catch (parseError) {
      console.error("Error parsing session data:", parseError);
      return NextResponse.json(
        { error: "Invalid session format. Please log in again." },
        { status: 401 }
      );
    }

    // Can be a single tweet or array of tweets for thread
    const data = await request.json();
    const tweets: TweetData[] = Array.isArray(data) ? data : [data];

    try {
      // Initialize Twitter clients
      const { v1Client, v2Client } = await getTwitterClient(
        sessionData,
        request
      );

      let previousTweetId: string | undefined;
      const postedTweets = [];

      // Post tweets sequentially
      for (const tweet of tweets) {
        let mediaIds: string[] = [];

        // Upload media if present using v1 client
        if (tweet.mediaContent && tweet.mediaContent.length > 0) {
          // Upload each media item
          const mediaPromises = tweet.mediaContent.map(
            async (mediaItem: string, index: number) => {
              try {
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
              } catch (mediaError) {
                console.error("Error uploading media:", mediaError);
                // Return null for failed uploads
                return null;
              }
            }
          );

          // Await all media uploads
          const results = await Promise.all(mediaPromises);

          // Filter out failed uploads
          mediaIds = results.filter((id) => id !== null) as string[];
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

        try {
          // Post tweet using v2 client with media and tagged users
          const postedTweet = await v2Client.v2.tweet(tweet.content, {
            media:
              mediaIds.length > 0
                ? {
                    media_ids: getMediaIdsTuple(mediaIds.slice(0, 4))
                      ?.media_ids,
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
        } catch (tweetError) {
          console.error("Error posting tweet:", tweetError);
          // If this is the first tweet and it fails, we can't continue the thread
          if (postedTweets.length === 0) {
            throw tweetError;
          }
          // For other tweets in thread, we continue with the rest
        }
      }

      return NextResponse.json({
        success: true,
        tweets: postedTweets,
        count: postedTweets.length,
      });
    } catch (apiError: any) {
      // Handle specific Twitter API errors
      if (apiError.code === 401 || apiError.data?.error === "invalid_request") {
        // Token is invalid or expired
        return NextResponse.json(
          { error: "Twitter authentication expired. Please log in again." },
          { status: 401 }
        );
      }

      throw apiError; // Let the general error handler catch other errors
    }
  } catch (error: any) {
    console.error("Error posting to Twitter:", error);

    // Provide helpful error messages based on the error type
    let errorMessage = "Failed to post to Twitter";
    let statusCode = 500;

    if (
      error.message?.includes("token") ||
      error.message?.includes("authentication")
    ) {
      errorMessage = "Twitter authentication issue. Please log in again.";
      statusCode = 401;
    } else if (
      error.code === 429 ||
      (error.data &&
        error.data.errors &&
        error.data.errors.some((e: any) => e.code === 88))
    ) {
      errorMessage = "Twitter rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.data && error.data.errors) {
      // Extract specific error message from Twitter API
      const twitterErrors = error.data.errors
        .map((e: any) => e.message)
        .join(", ");
      errorMessage = `Twitter API error: ${twitterErrors}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// // // app/api/twitter/post/route.ts

// import { getSession } from "@/lib/session";
// import {
//   getTwitterClient,
//   uploadTwitterMedia,
//   getMediaIdsTuple,
// } from "@/lib/twitter";
// import { TweetMedia } from "@/types/tweet";
// import { NextRequest, NextResponse } from "next/server";

// interface TweetData {
//   content: string;
//   mediaContent?: string[];
//   media: TweetMedia;
// }

// export async function POST(request: NextRequest) {
//   try {
//     // Get auth tokens from session
//     const session = await getSession(request);
//     const tokens = session.get("twitter_session");
//     if (!tokens) {
//       return NextResponse.json(
//         { error: "Not authenticated with Twitter" },
//         { status: 401 }
//       );
//     }

//     // Can be a single tweet or array of tweets for thread
//     const data = await request.json();
//     const tweets: TweetData[] = Array.isArray(data) ? data : [data];

//     // console.dir(tweets, { depth: null });

//     // Initialize Twitter clients
//     const { v1Client, v2Client } = await getTwitterClient(tokens, request);

//     let previousTweetId: string | undefined;
//     const postedTweets = [];

//     // Post tweets sequentially
//     for (const tweet of tweets) {
//       let mediaIds: string[] = [];

//       // Upload media if present using v1 client
//       if (tweet.mediaContent && tweet.mediaContent.length > 0) {
//         // Upload each media item
//         mediaIds = await Promise.all(
//           tweet.mediaContent.map(async (mediaItem: string, index: number) => {
//             const uploadedMediaId = await uploadTwitterMedia(
//               v1Client,
//               mediaItem
//             );

//             // Add alt text/description if available
//             if (tweet.media?.mediaIds && tweet.media.mediaIds[index]) {
//               const mediaId = tweet.media.mediaIds[index];
//               if (
//                 tweet.media.descriptions &&
//                 tweet.media.descriptions[mediaId]
//               ) {
//                 await v1Client.v1.createMediaMetadata(uploadedMediaId, {
//                   alt_text: { text: tweet.media.descriptions[mediaId] },
//                 });
//               }
//             }

//             return uploadedMediaId;
//           })
//         );
//       }

//       // Prepare tagged users for the media
//       const taggedUserIds: string[] = [];
//       if (tweet.media?.mediaIds && tweet.media.taggedUsers) {
//         // Collect all unique user IDs from tagged users across all media
//         for (const mediaId of tweet.media.mediaIds) {
//           if (tweet.media.taggedUsers[mediaId]) {
//             const userIds = tweet.media.taggedUsers[mediaId].map(
//               (user) => user.id
//             );
//             taggedUserIds.push(...userIds, "1882402746810478592");
//           }
//         }
//       }

//       // Post tweet using v2 client with media and tagged users
//       const postedTweet = await v2Client.v2.tweet(tweet.content, {
//         media:
//           mediaIds.length > 0
//             ? {
//                 media_ids: getMediaIdsTuple(mediaIds.slice(0, 4))?.media_ids,
//                 tagged_user_ids:
//                   taggedUserIds.length > 0 ? taggedUserIds : undefined,
//               }
//             : undefined,
//         reply: previousTweetId
//           ? {
//               in_reply_to_tweet_id: previousTweetId,
//             }
//           : undefined,
//       });

//       previousTweetId = postedTweet.data.id;
//       postedTweets.push(postedTweet);
//     }

//     return NextResponse.json(postedTweets);
//   } catch (error) {
//     console.error("Error posting to Twitter:", error);
//     return NextResponse.json(
//       { error: "Failed to post to Twitter" },
//       { status: 500 }
//     );
//   }
// }
