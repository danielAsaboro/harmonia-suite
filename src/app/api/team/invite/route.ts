// /app/api/team/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateInviteToken } from "@/utils/jwt";
import { teamInvitesService } from "@/lib/services";
import { getUserData } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read the request body ONCE
    const body = await req.json();
    const { email, role } = body;

    // Always derive team ID from the current user's Twitter ID
    const teamId = userData.userId;

    // Check if team exists, if not create one
    let team = await prismaDb.teams.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      // Create team with user's Twitter ID as team ID
      const now = new Date().toISOString();
      team = await prismaDb.teams.create({
        data: {
          id: teamId,
          name: `${userData.userData.username}'s Team`,
          createdAt: now,
          updatedAt: now,
          members: {
            create: {
              id: nanoid(),
              userId: userData.userId,
              role: "admin",
              joinedAt: now,
            },
          },
        },
      });
    }

    // Check if user is a member of the team with admin role
    const isAdmin = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId: userData.userId,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Only team admins can send invites",
        },
        { status: 403 }
      );
    }

    // Generate token for the invite
    const token = generateInviteToken({
      email,
      role,
      teamId,
      inviteId: nanoid(),
    });

    // Calculate expiry date (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invite record
    await teamInvitesService.createInvite({
      teamId,
      email,
      role,
      token,
      createdBy: userData.userId,
      expiresAt: expiresAt.toISOString(),
    });

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/team/join?token=${token}`;

    console.log(" printing inviteurl", inviteUrl);

    // Send invite email
    // await EmailService.sendTeamInvite({
    //   email,
    //   inviterName: userData.userData.name,
    //   teamName: team.name,
    //   role,
    //   inviteUrl,
    //   expiresIn: "48 hours",
    // });

    return NextResponse.json({
      success: true,
      invite: {
        teamId: team.id,
        teamName: team.name,
        email,
        role,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating team invite:", error);
    return NextResponse.json(
      {
        error: "Failed to create invite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get pending invites for a team
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the user's ID as the team ID
    const teamId = userData.userId;

    // Verify the user is part of this team
    const membership = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId: userData.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Fetch pending invites for the team
    const invites = await teamInvitesService.getTeamPendingInvites(teamId);

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
