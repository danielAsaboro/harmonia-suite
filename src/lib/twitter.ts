// lib/twitter.ts
import { TwitterApi } from "twitter-api-v2";
import { getSession } from "./session";
import { NextRequest, NextResponse } from "next/server";
import { userTokensService } from "./services";

interface TwitterTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  // OAuth 1.0a tokens for media upload
  oauth1AccessToken?: string;
  oauth1AccessSecret?: string;
}

interface TwitterSessionData {
  tokens: TwitterTokens;
  userData: any;
}

export async function getTwitterClient(
  sessionData: string,
  req?: NextRequest
): Promise<{ v1Client: TwitterApi; v2Client: TwitterApi }> {
  try {
    // Parse session data
    const parsedSession = JSON.parse(sessionData);
    const { tokens, userData } = parsedSession as TwitterSessionData;

    // Check if the token needs refresh
    const now = Date.now();
    const tokenExpiresAt = new Date(tokens.expiresAt!).getTime();

    // If token is expired or will expire in less than 5 minutes, refresh it
    if (tokenExpiresAt - now < 5 * 60 * 1000) {
      // Try to refresh from database first
      const dbTokens = await userTokensService.getUserTokens(userData.id);

      if (dbTokens && new Date(dbTokens.expiresAt).getTime() > now) {
        // Use the fresh tokens from database if they're valid
        const v2Client = new TwitterApi(dbTokens.accessToken);

        // Update session if request is provided
        if (req) {
          const session = await getSession(req);
          parsedSession.tokens.accessToken = dbTokens.accessToken;
          parsedSession.tokens.expiresAt = dbTokens.expiresAt;
          await session.update(
            "twitter_session",
            JSON.stringify(parsedSession)
          );
        }

        // Use OAuth 1.0a for v1 endpoints if available
        let v1Client = v2Client;
        if (tokens.oauth1AccessToken && tokens.oauth1AccessSecret) {
          v1Client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_SECRET!,
            accessToken: tokens.oauth1AccessToken,
            accessSecret: tokens.oauth1AccessSecret,
          });
        }

        return { v1Client, v2Client };
      } else {
        // Refresh the token using refresh token
        try {
          const client = new TwitterApi({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
          });

          const { accessToken, refreshToken, expiresIn } =
            await client.refreshOAuth2Token(tokens.refreshToken!);

          // Update tokens in both session and database
          if (req) {
            const session = await getSession(req);
            parsedSession.tokens.accessToken = accessToken;
            parsedSession.tokens.refreshToken = refreshToken;
            parsedSession.tokens.expiresAt = Date.now() + expiresIn * 1000;
            await session.update(
              "twitter_session",
              JSON.stringify(parsedSession)
            );
          }

          await userTokensService.updateUserTokens(
            userData.id,
            accessToken,
            new Date(Date.now() + expiresIn * 1000).toISOString()
          );

          const v2Client = new TwitterApi(accessToken);

          // Use OAuth 1.0a for v1 endpoints if available
          let v1Client = v2Client;
          if (tokens.oauth1AccessToken && tokens.oauth1AccessSecret) {
            v1Client = new TwitterApi({
              appKey: process.env.TWITTER_API_KEY!,
              appSecret: process.env.TWITTER_API_SECRET!,
              accessToken: tokens.oauth1AccessToken,
              accessSecret: tokens.oauth1AccessSecret,
            });
          }

          return { v1Client, v2Client };
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          throw new Error(
            "Failed to refresh Twitter token. Please log out and log in again."
          );
        }
      }
    }

    // Token is valid, use it directly
    const v2Client = new TwitterApi(tokens.accessToken);

    // Use OAuth 1.0a for v1 endpoints if available
    let v1Client = v2Client;
    if (tokens.oauth1AccessToken && tokens.oauth1AccessSecret) {
      v1Client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: tokens.oauth1AccessToken,
        accessSecret: tokens.oauth1AccessSecret,
      });
    }

    return { v1Client, v2Client };
  } catch (error) {
    console.error("Error getting Twitter client:", error);
    throw new Error("Failed to initialize Twitter client");
  }
}

// export async function getTwitterClient(
//   sessionData: string,
//   req?: NextRequest
// ): Promise<{ v1Client: TwitterApi; v2Client: TwitterApi }> {
//   try {
//     const { tokens } = JSON.parse(sessionData) as TwitterSessionData;

//     // Initialize OAuth 1.0a client if tokens exist
//     let v1Client: TwitterApi | null = null;
//     if (tokens.oauth1AccessToken && tokens.oauth1AccessSecret) {
//       v1Client = new TwitterApi({
//         appKey: process.env.TWITTER_API_KEY!,
//         appSecret: process.env.TWITTER_API_SECRET!,
//         accessToken: tokens.oauth1AccessToken,
//         accessSecret: tokens.oauth1AccessSecret,
//       });
//     }

//     // Check if OAuth 2.0 token needs refresh
//     let v2AccessToken = tokens.accessToken;
//     if (
//       tokens.expiresAt &&
//       Date.now() >= tokens.expiresAt &&
//       tokens.refreshToken
//     ) {
//       const tempClient = new TwitterApi({
//         clientId: process.env.TWITTER_CLIENT_ID!,
//         clientSecret: process.env.TWITTER_CLIENT_SECRET!,
//       });

//       const {
//         accessToken: newAccessToken,
//         refreshToken: newRefreshToken,
//         expiresIn,
//       } = await tempClient.refreshOAuth2Token(tokens.refreshToken);

//       // Create updated session data
//       const updatedSessionData: TwitterSessionData = {
//         tokens: {
//           ...tokens,
//           accessToken: newAccessToken,
//           refreshToken: newRefreshToken,
//           expiresAt: Date.now() + expiresIn * 1000,
//         },
//         userData: JSON.parse(sessionData).userData,
//       };

//       // Update session if request is provided
//       if (req) {
//         const session = await getSession(req);
//         await session.update(
//           "twitter_session",
//           JSON.stringify(updatedSessionData)
//         );
//       }

//       v2AccessToken = newAccessToken;
//     }

//     // Create OAuth 2.0 client
//     const v2Client = new TwitterApi(v2AccessToken);

//     // If no OAuth 1.0a client exists, create a read-only one for media uploads
//     if (!v1Client) {
//       v1Client = new TwitterApi({
//         appKey: process.env.TWITTER_API_KEY!,
//         appSecret: process.env.TWITTER_API_SECRET!,
//       });
//     }

//     return { v1Client, v2Client };
//   } catch (error) {
//     console.error("Error getting Twitter client:", error);
//     throw new Error("Failed to initialize Twitter client");
//   }
// }

// Helper function to handle media uploads

export async function uploadTwitterMedia(
  client: TwitterApi,
  mediaData: string
): Promise<string> {
  try {
    // Remove data:image/jpeg;base64, prefix
    const base64Data = mediaData.split(";base64,").pop() || "";
    const buffer = Buffer.from(base64Data, "base64");

    // Determine media type from the data URL
    const mediaType = mediaData.split(";")[0].split("/")[1];

    // Upload to Twitter using v1 API
    const mediaId = await client.v1.uploadMedia(buffer, {
      mimeType: `image/${mediaType}`,
    });

    return mediaId;
  } catch (error) {
    console.error("Error uploading media to Twitter:", error);
    throw new Error("Failed to upload media to Twitter");
  }
}

//
// Helper function to convert array to correct tuple type
export const getMediaIdsTuple = (ids: string[]) => {
  const mediaCount = ids.length;
  if (mediaCount === 1) return { media_ids: [ids[0]] as [string] };
  if (mediaCount === 2)
    return { media_ids: [ids[0], ids[1]] as [string, string] };
  if (mediaCount === 3)
    return {
      media_ids: [ids[0], ids[1], ids[2]] as [string, string, string],
    };
  if (mediaCount === 4)
    return {
      media_ids: [ids[0], ids[1], ids[2], ids[3]] as [
        string,
        string,
        string,
        string,
      ],
    };
  return undefined;
};

/**
 * Extracts tweet ID from various Twitter URL formats
 * Supports both twitter.com and x.com URLs
 */
export function extractTweetId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    // Check if it's a valid Twitter/X domain
    if (!parsedUrl.hostname.match(/^((?:mobile\.)?(?:twitter\.com|x\.com))$/)) {
      return null;
    }

    // Extract tweet ID from path
    // Handles formats like:
    // - twitter.com/username/status/1234567890
    // - x.com/username/status/1234567890
    const match = parsedUrl.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates if a string is a valid tweet ID
 */
export function isValidTweetId(id: string): boolean {
  // Tweet IDs are numeric strings
  return /^\d+$/.test(id);
}

/**
 * Normalizes Twitter URLs to a standard format
 */
export function normalizeTweetUrl(url: string): string | null {
  const tweetId = extractTweetId(url);
  if (!tweetId) return null;

  return `https://twitter.com/i/web/status/${tweetId}`;
}
