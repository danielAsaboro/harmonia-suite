// /lib/twitter/publisher.ts
import { ScheduledTweet, ScheduledThread, TokenData } from "../db/schema";
import { TwitterApi } from "twitter-api-v2";
import { getMediaFile } from "@/lib/storage/indexedDB";
import { userTokensService } from "../services";
import { getMediaIdsTuple } from "../twitter";

async function refreshTokenIfNeeded(userTokens: TokenData): Promise<string> {
  const now = Date.now();
  const tokenExpiresAt = new Date(userTokens.expiresAt).getTime();

  // If token expires in less than 5 minutes, refresh it
  if (tokenExpiresAt - now < 5 * 60 * 1000) {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    });

    try {
      const { accessToken, refreshToken, expiresIn } =
        await client.refreshOAuth2Token(userTokens.refreshToken);

      // Update tokens in database
      await userTokensService.updateUserTokens(
        userTokens.userId,
        accessToken,
        new Date(Date.now() + expiresIn * 1000).toISOString()
      );

      return accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  return userTokens.accessToken;
}

async function getTwitterClient(userTokens: TokenData): Promise<TwitterApi> {
  try {
    const accessToken = await refreshTokenIfNeeded(userTokens);
    return new TwitterApi(accessToken);
  } catch (error) {
    console.error("Error creating Twitter client:", error);
    throw error;
  }
}

export async function publishTweet(tweet: ScheduledTweet) {
  try {
    if (!tweet.userTokens) {
      throw new Error("No user tokens found for tweet");
    }

    const client = await getTwitterClient(tweet.userTokens);
    const v2Client = client.v2;

    // Upload media if present
    let mediaIds: string[] = [];
    if (tweet.media && tweet.media.mediaIds.length > 0) {
      mediaIds = await Promise.all(
        tweet.media.mediaIds.map(async (mediaId) => {
          const mediaData = await getMediaFile(mediaId);
          if (!mediaData) throw new Error(`Media not found: ${mediaId}`);

          // Remove data:image/jpeg;base64, prefix
          const base64Data = mediaData.split(";base64,").pop() || "";
          const buffer = Buffer.from(base64Data, "base64");

          // Determine media type from the data URL
          const mediaType = mediaData.split(";")[0].split("/")[1];

          // Upload to Twitter
          const mediaResponse = await client.v1.uploadMedia(buffer, {
            mimeType: `image/${mediaType}`,
          });

          // Add alt text if available
          if (tweet.media?.descriptions?.[mediaId]) {
            await client.v1.createMediaMetadata(mediaResponse, {
              alt_text: { text: tweet.media.descriptions[mediaId] },
            });
          }

          return mediaResponse;
        })
      );
    }

    // Post tweet
    const response = await v2Client.tweet(tweet.content, {
      media:
        mediaIds.length > 0
          ? getMediaIdsTuple(mediaIds.slice(0, 4))
          : undefined,
    });

    return response;
  } catch (error) {
    console.error("Error publishing tweet:", error);
    throw error;
  }
}

export async function publishThread(
  thread: ScheduledThread,
  tweets: ScheduledTweet[]
) {
  try {
    if (!thread.userTokens) {
      throw new Error("No user tokens found for thread");
    }

    const client = await getTwitterClient(thread.userTokens);
    const v2Client = client.v2;
    let previousTweetId: string | undefined;
    const responses = [];

    // Post tweets sequentially
    for (const tweet of tweets) {
      // Upload media if present
      let mediaIds: string[] = [];
      if (tweet.media && tweet.media.mediaIds.length > 0) {
        mediaIds = await Promise.all(
          tweet.media.mediaIds.map(async (mediaId) => {
            const mediaData = await getMediaFile(mediaId);
            if (!mediaData) throw new Error(`Media not found: ${mediaId}`);

            // Remove data:image/jpeg;base64, prefix
            const base64Data = mediaData.split(";base64,").pop() || "";
            const buffer = Buffer.from(base64Data, "base64");

            // Determine media type
            const mediaType = mediaData.split(";")[0].split("/")[1];

            // Upload to Twitter
            const mediaResponse = await client.v1.uploadMedia(buffer, {
              mimeType: `image/${mediaType}`,
            });

            // Add alt text if available
            if (tweet.media?.descriptions?.[mediaId]) {
              await client.v1.createMediaMetadata(mediaResponse, {
                alt_text: { text: tweet.media.descriptions[mediaId] },
              });
            }

            return mediaResponse;
          })
        );
      }

      // Post tweet
      const response = await v2Client.tweet(tweet.content, {
        media:
          mediaIds.length > 0
            ? getMediaIdsTuple(mediaIds.slice(0, 4))
            : undefined,
        reply: previousTweetId
          ? {
              in_reply_to_tweet_id: previousTweetId,
            }
          : undefined,
      });

      previousTweetId = response.data.id;
      responses.push(response);
    }

    return responses;
  } catch (error) {
    console.error("Error publishing thread:", error);
    throw error;
  }
}
