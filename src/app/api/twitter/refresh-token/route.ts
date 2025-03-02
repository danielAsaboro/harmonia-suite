// app/api/twitter/refresh-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { userTokensService } from "@/lib/services";
import { TwitterApi } from "twitter-api-v2";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const sessionData = session.get("twitter_session");

    if (!sessionData) {
      return NextResponse.json(
        { error: "Not authenticated with Twitter" },
        { status: 401 }
      );
    }

    const { tokens, userData } = JSON.parse(sessionData);

    if (!tokens.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    // Use Twitter API to refresh the token
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    });

    const { accessToken, refreshToken, expiresIn } =
      await client.refreshOAuth2Token(tokens.refreshToken);

    // Update session
    const updatedSessionData = {
      ...JSON.parse(sessionData),
      tokens: {
        ...tokens,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      },
    };

    await session.update("twitter_session", JSON.stringify(updatedSessionData));

    // Update database
    await userTokensService.updateUserTokens(
      userData.id,
      accessToken,
      new Date(Date.now() + expiresIn * 1000).toISOString()
    );

    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
