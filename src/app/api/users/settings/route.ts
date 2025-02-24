// app/api/users/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";
import { ContentType } from "@/types/onboarding";

interface SettingsUpdate {
  emailNotifications?: boolean;
  contentTypes?: ContentType[];
  timezone?: string;
  theme?: "light" | "dark" | "system";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    const userSettings = await prismaDb.user_tokens.findUnique({
      where: { userId },
      select: {
        contentPreferences: true,
        timezone: true,
        email: true,
        emailVerified: true,
        walletAddress: true,
      },
    });

    if (!userSettings) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse content preferences
    const contentPreferences = userSettings.contentPreferences as {
      emailNotifications?: boolean;
      contentTypes?: ContentType[];
      theme?: "light" | "dark" | "system";
    } | null;

    return NextResponse.json({
      ...userSettings,
      emailNotifications: contentPreferences?.emailNotifications ?? true,
      contentTypes: contentPreferences?.contentTypes ?? [
        "tweets",
        "threads",
        "scheduled",
      ],
      theme: contentPreferences?.theme ?? "system",
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

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
    const updates: SettingsUpdate = body;

    // Get current settings
    const currentUser = await prismaDb.user_tokens.findUnique({
      where: { userId },
      select: {
        contentPreferences: true,
      },
    });

    const currentPreferences = (currentUser?.contentPreferences as any) || {};

    // Update content preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(updates.emailNotifications !== undefined && {
        emailNotifications: updates.emailNotifications,
      }),
      ...(updates.contentTypes && { contentTypes: updates.contentTypes }),
      ...(updates.theme && { theme: updates.theme }),
    };

    // Update user settings
    const updatedUser = await prismaDb.user_tokens.update({
      where: { userId },
      data: {
        ...(updates.timezone && { timezone: updates.timezone }),
        contentPreferences: updatedPreferences,
      },
      select: {
        contentPreferences: true,
        timezone: true,
      },
    });

    return NextResponse.json({
      ...updatedUser,
      emailNotifications: updatedPreferences.emailNotifications,
      contentTypes: updatedPreferences.contentTypes,
      theme: updatedPreferences.theme,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
