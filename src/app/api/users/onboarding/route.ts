// src/app/api/users/onboarding/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";
import { cookies } from "next/headers";

// Get current onboarding state
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    const user = await prismaDb.user_tokens.findUnique({
      where: { userId },
      select: {
        email: true,
        emailVerified: true,
        walletAddress: true,
        timezone: true,
        contentPreferences: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching onboarding state:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding state" },
      { status: 500 }
    );
  }
}

// Update onboarding data
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    const body = await req.json();
    const {
      email,
      walletAddress,
      timezone,
      contentPreferences,
      completeOnboarding = false,
    } = body;

    // Validate email if provided
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate wallet address if provided
    if (
      walletAddress &&
      !walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
    ) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Update user data
    const updatedUser = await prismaDb.user_tokens.update({
      where: { userId },
      data: {
        ...(email && { email }),
        ...(walletAddress && { walletAddress }),
        ...(timezone && { timezone }),
        ...(contentPreferences && { contentPreferences }),
        onboardingCompleted: completeOnboarding,
      },
    });

    // Set onboarding completion cookie if requested
    if (completeOnboarding) {
      const cookieStore = cookies();
      cookieStore.set("onboarding_complete", "true", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding data" },
      { status: 500 }
    );
  }
}

// Handle email verification
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    const body = await req.json();
    const { verifyEmail } = body;

    if (verifyEmail) {
      const user = await prismaDb.user_tokens.update({
        where: { userId },
        data: {
          emailVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        user,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
