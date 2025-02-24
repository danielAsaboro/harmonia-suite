// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const twitterSession = session.get("twitter_session");

    if (!twitterSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userData } = JSON.parse(twitterSession);
    const userId = userData.id;

    // Get user profile with team memberships and social account data
    const userProfile = await prismaDb.user_tokens.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        name: true,
        profileImageUrl: true,
        email: true,
        emailVerified: true,
        walletAddress: true,
        timezone: true,
        contentPreferences: true,
        verified: true,
        verifiedType: true,
        teamMemberships: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                members: {
                  select: {
                    role: true,
                    userId: true,
                    user: {
                      select: {
                        name: true,
                        username: true,
                        profileImageUrl: true,
                      },
                    },
                  },
                },
              },
            },
            role: true,
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log(userProfile)

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Update user profile
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
    const { name, timezone, contentPreferences } = body;

    const updatedProfile = await prismaDb.user_tokens.update({
      where: { userId },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(contentPreferences && { contentPreferences }),
      },
      select: {
        userId: true,
        username: true,
        name: true,
        profileImageUrl: true,
        email: true,
        emailVerified: true,
        timezone: true,
        contentPreferences: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
