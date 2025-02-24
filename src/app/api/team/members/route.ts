// /app/api/team/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/session";
import { prismaDb } from "@/lib/db/prisma_service";
import { nanoid } from "nanoid";

// Get team members
export async function GET(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Always use the user's Twitter ID as the team ID
    const teamId = userData.userId;

    // Ensure team exists
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

    // Ensure user is a member of the team
    const isMember = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId: userData.userId,
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Get all team members with user details
    const members = await prismaDb.team_members.findMany({
      where: {
        teamId,
      },
      include: {
        user: {
          select: {
            name: true,
            walletAddress: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json({
      members,
      team,
      userRole: isMember.role,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// Add member to team
export async function POST(req: NextRequest) {
  try {
    const userData = await getUserData(req);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Always use the current user's team ID
    const teamId = userData.userId;

    // Ensure team exists
    let team = await prismaDb.teams.findUnique({
      where: { id: teamId },
    });

    if (!team) {
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

    // Verify current user is an admin
    const isAdmin = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId: userData.userId,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can add members" },
        { status: 403 }
      );
    }

    const { userId, role } = await req.json();

    // Check if the user exists
    const memberExists = await prismaDb.user_tokens.findUnique({
      where: { userId },
    });

    if (!memberExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if member is already in the team
    const existingMember = await prismaDb.team_members.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add member to team
    const newMember = await prismaDb.team_members.create({
      data: {
        id: nanoid(),
        teamId,
        userId,
        role,
        joinedAt: new Date().toISOString(),
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      team: {
        id: teamId,
        name: team.name,
      },
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
